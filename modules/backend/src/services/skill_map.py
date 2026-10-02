"""AI skill map: a prerequisite graph of AI concepts, per-learner mastery taken
from existing lesson results, goal-driven routes, and LLM-assisted growth.

Read-only over lessons: nothing here changes how lessons are planned or taught.
New concepts added by learners persist in data/skill_map_custom.json.
"""

from __future__ import annotations

import json
import logging
import os
import re
import tempfile
import threading
from pathlib import Path
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from modules.backend.src.db.models import Lesson, LessonNodeRow

logger = logging.getLogger(__name__)

TRACKS = [
    ("math", "Math foundations"),
    ("ml", "Classical ML"),
    ("dl", "Deep learning"),
    ("nlp", "Language & transformers"),
    ("gen", "Generative AI"),
    ("frontier", "Frontier"),
]

# (id, title, track, prerequisites, match keywords)
_CORE: list[tuple[str, str, str, list[str], list[str]]] = [
    # math
    ("vectors", "Vectors & matrices", "math", [], ["vector", "matrix", "matrices", "linear algebra"]),
    ("dot_product", "Dot product & similarity", "math", ["vectors"], ["dot product", "cosine similarity"]),
    ("matrix_mult", "Matrix multiplication", "math", ["vectors"], ["matrix multiplication", "matmul"]),
    ("eigen", "Eigenvectors & SVD", "math", ["matrix_mult"], ["eigen", "svd", "singular value"]),
    ("derivatives", "Derivatives", "math", [], ["derivative", "differentiation", "slope"]),
    ("chain_rule", "Chain rule & partial derivatives", "math", ["derivatives"], ["chain rule", "partial derivative"]),
    ("gradients", "Gradients", "math", ["chain_rule", "vectors"], ["gradient vector"]),
    ("probability", "Probability basics", "math", [], ["probability", "random variable"]),
    ("distributions", "Probability distributions", "math", ["probability"], ["distribution", "gaussian", "normal distribution", "bernoulli"]),
    ("bayes", "Bayes' theorem", "math", ["probability"], ["bayes", "conditional probability", "posterior"]),
    ("statistics", "Mean, variance & statistics", "math", ["probability"], ["variance", "statistics", "standard deviation", "mean"]),
    ("info_theory", "Entropy & information theory", "math", ["distributions"], ["entropy", "kl divergence", "information theory"]),
    ("optimization", "Optimisation basics", "math", ["gradients"], ["optimisation", "optimization", "convex", "minimum"]),
    # classical ML
    ("what_is_ml", "What is machine learning?", "ml", [], ["what is ai", "machine learning", "what is ml", "artificial intelligence"]),
    ("data_features", "Data, features & labels", "ml", ["what_is_ml"], ["feature", "label", "dataset"]),
    ("linear_regression", "Linear regression", "ml", ["data_features", "vectors"], ["linear regression", "regression"]),
    ("loss_functions", "Loss functions", "ml", ["linear_regression"], ["loss function", "loss", "mean squared error", "mse", "cross-entropy"]),
    ("gradient_descent", "Gradient descent", "ml", ["loss_functions", "gradients"], ["gradient descent", "learning rate", "sgd"]),
    ("logistic_regression", "Logistic regression", "ml", ["linear_regression", "probability"], ["logistic regression", "sigmoid", "classification"]),
    ("train_test", "Train/validation/test splits", "ml", ["data_features"], ["train test", "validation set", "test set", "cross-validation"]),
    ("overfitting", "Overfitting & generalisation", "ml", ["train_test", "loss_functions"], ["overfit", "underfit", "generali", "bias-variance"]),
    ("regularization", "Regularisation", "ml", ["overfitting"], ["regulari", "l1", "l2", "weight decay"]),
    ("metrics", "Evaluation metrics", "ml", ["train_test"], ["accuracy", "precision", "recall", "f1", "roc", "confusion matrix"]),
    ("decision_trees", "Decision trees", "ml", ["data_features"], ["decision tree"]),
    ("ensembles", "Random forests & boosting", "ml", ["decision_trees", "overfitting"], ["random forest", "boosting", "xgboost", "ensemble"]),
    ("svm", "Support vector machines", "ml", ["logistic_regression", "dot_product"], ["svm", "support vector"]),
    ("knn", "k-nearest neighbours", "ml", ["data_features", "dot_product"], ["knn", "nearest neighbo"]),
    ("clustering", "Clustering (k-means)", "ml", ["data_features", "statistics"], ["cluster", "k-means", "kmeans"]),
    ("pca", "Dimensionality reduction (PCA)", "ml", ["eigen", "statistics"], ["pca", "dimensionality reduction", "principal component"]),
    # deep learning
    ("perceptron", "Neurons & perceptrons", "dl", ["linear_regression"], ["perceptron", "neuron"]),
    ("activations", "Activation functions", "dl", ["perceptron"], ["activation", "relu", "tanh", "softmax"]),
    ("mlp", "Neural networks (MLPs)", "dl", ["activations", "matrix_mult"], ["neural network", "multilayer", "mlp", "hidden layer"]),
    ("backprop", "Backpropagation", "dl", ["mlp", "chain_rule", "gradient_descent"], ["backprop"]),
    ("optimizers", "Optimisers (Momentum, Adam)", "dl", ["gradient_descent"], ["adam", "momentum", "optimizer", "optimiser", "rmsprop"]),
    ("init_norm", "Initialisation & normalisation", "dl", ["backprop"], ["batch norm", "layer norm", "normalization", "normalisation", "initiali"]),
    ("dropout", "Dropout", "dl", ["regularization", "mlp"], ["dropout"]),
    ("cnn", "Convolutional networks (CNNs)", "dl", ["mlp"], ["cnn", "convolution", "image classification"]),
    ("rnn", "Recurrent networks (RNNs)", "dl", ["mlp"], ["rnn", "recurrent"]),
    ("lstm", "LSTMs & GRUs", "dl", ["rnn"], ["lstm", "gru", "vanishing gradient"]),
    ("resnet", "Residual connections", "dl", ["cnn", "init_norm"], ["resnet", "residual", "skip connection"]),
    ("transfer", "Transfer learning & fine-tuning", "dl", ["cnn"], ["transfer learning", "fine-tun", "pretrained"]),
