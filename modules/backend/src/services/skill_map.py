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
    # language & transformers
    ("tokenization", "Tokenisation", "nlp", ["what_is_ml"], ["token", "bpe", "wordpiece"]),
    ("embeddings", "Embeddings & word vectors", "nlp", ["dot_product", "tokenization"], ["embedding", "word2vec", "word vector"]),
    ("seq2seq", "Sequence-to-sequence models", "nlp", ["lstm", "embeddings"], ["seq2seq", "encoder-decoder", "machine translation"]),
    ("attention", "Attention", "nlp", ["seq2seq", "dot_product", "activations"], ["attention"]),
    ("self_attention", "Self-attention & multi-head", "nlp", ["attention", "matrix_mult"], ["self-attention", "multi-head", "query key value"]),
    ("transformer", "The Transformer", "nlp", ["self_attention", "resnet", "init_norm"], ["transformer"]),
    ("positional", "Positional encoding", "nlp", ["transformer"], ["positional encoding", "rope", "rotary"]),
    ("bert", "Encoder models (BERT)", "nlp", ["transformer"], ["bert", "masked language"]),
    ("gpt", "Decoder models (GPT)", "nlp", ["transformer"], ["gpt", "decoder-only", "autoregressive"]),
    ("llm_pretraining", "LLM pre-training & scaling", "nlp", ["gpt", "info_theory"], ["pre-training", "pretraining", "scaling law", "large language model", "llm"]),
    ("prompting", "Prompting & in-context learning", "nlp", ["llm_pretraining"], ["prompt", "few-shot", "in-context", "chain of thought"]),
    # generative
    ("autoencoders", "Autoencoders", "gen", ["mlp"], ["autoencoder"]),
    ("vae", "Variational autoencoders", "gen", ["autoencoders", "distributions", "info_theory"], ["vae", "variational"]),
    ("gan", "GANs", "gen", ["mlp", "loss_functions"], ["gan", "generative adversarial"]),
    ("diffusion", "Diffusion models", "gen", ["vae", "distributions"], ["diffusion", "denoising", "stable diffusion"]),
    ("instruction_tuning", "Instruction tuning", "gen", ["llm_pretraining", "transfer"], ["instruction tun", "sft", "supervised fine"]),
    ("rlhf", "RLHF & preference tuning", "gen", ["instruction_tuning", "rl_basics"], ["rlhf", "dpo", "preference", "reward model"]),
    ("rl_basics", "Reinforcement learning basics", "gen", ["probability", "optimization"], ["reinforcement learning", "q-learning", "policy", "reward"]),
    ("multimodal", "Multimodal models (vision-language)", "gen", ["transformer", "cnn"], ["multimodal", "vision-language", "clip", "vlm"]),
    # frontier
    ("lora", "LoRA & efficient fine-tuning", "frontier", ["instruction_tuning", "eigen"], ["lora", "qlora", "peft", "adapter"]),
    ("quantization", "Quantisation & efficient inference", "frontier", ["llm_pretraining"], ["quantiz", "quantis", "int8", "int4"]),
    ("moe", "Mixture of Experts", "frontier", ["transformer"], ["mixture of experts", "moe"]),
    ("ssm", "State-space models", "frontier", ["rnn", "matrix_mult"], ["state space", "state-space", "s4"]),
    ("mamba", "Mamba", "frontier", ["ssm", "transformer"], ["mamba"]),
    ("long_context", "Long context & efficient attention", "frontier", ["self_attention", "positional"], ["long context", "flash attention", "sparse attention", "kv cache"]),
    ("rag", "Retrieval-augmented generation (RAG)", "frontier", ["embeddings", "prompting"], ["rag", "retrieval", "vector database"]),
    ("agents", "AI agents & tool use", "frontier", ["prompting", "rag"], ["agent", "tool use", "function calling"]),
    ("reasoning_models", "Reasoning models", "frontier", ["prompting", "rlhf"], ["reasoning model", "test-time compute", "o1"]),
    ("evaluation_llm", "Evaluating LLMs", "frontier", ["metrics", "llm_pretraining"], ["benchmark", "llm evaluation", "eval"]),
    ("ai_safety", "AI safety & alignment", "frontier", ["rlhf"], ["safety", "alignment", "hallucination", "jailbreak"]),
]

_CUSTOM_PATH = Path(os.environ.get("SKILL_MAP_CUSTOM_PATH", Path(__file__).resolve().parents[4] / "data" / "skill_map_custom.json"))
_LOCK = threading.Lock()


class NotAITopic(ValueError):
    """The LLM judged the requested topic to be outside AI."""
_TRACK_IDS = {t for t, _ in TRACKS}


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")[:60] or "concept"


def _load_custom() -> list[dict]:
    try:
        data = json.loads(_CUSTOM_PATH.read_text(encoding="utf-8"))
        return [c for c in data if isinstance(c, dict) and c.get("id")]
    except (OSError, ValueError):
        return []


def _save_custom(items: list[dict]) -> None:
    _CUSTOM_PATH.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=_CUSTOM_PATH.parent, suffix=".json")
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
