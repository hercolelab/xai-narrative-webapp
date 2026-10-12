# Counterfactual Narrative XAI

Research software for generating natural-language explanations grounded in factual–counterfactual pairs. It combines small-language-model inference, knowledge distillation, multi-draft self-refinement, structured evaluation, and an optional interactive interface.

## Core functionality

- Generate counterfactual narratives directly or use a multi-narrative pipeline that refines several drafts into one explanation.
- Work with Adult Income, California Housing, Diabetes, and Titanic examples.
- Run base or fine-tuned language models through the local inference stack (vLLM-supported models require a compatible GPU).
- Return structured explanation fields alongside the natural-language narrative, enabling checks of changed features and target labels.
- Evaluate outputs with Perfect Feature Faithfulness (PFF), Target Faithfulness (TF), and JSON Parsing Rate (JPR); compare quality and inference costs across models and refinement settings.
- Use the backend API and frontend components for interactive inference and comparison.

**Fine-tuning code:** go to the `llm_kd/` Git submodule; the student training scripts and configurations live there. Initialize it with `git submodule update --init --recursive`. This repository contains the inference API and optional interface. See [SETUP.md](SETUP.md) for setup details. Fine-tuned model artifacts are listed at [Hugging Face](https://huggingface.co/phdsilver22/models).

## Additional Results: full Table 1

The paper reports four-dataset means. This table gives the full per-dataset breakdown. Every metric entry is **without refiner / with refiner**; Plain denotes the base model and FT the knowledge-distilled, LoRA fine-tuned model. The teacher has no FT results. Values are proportions in $[0,1]$.

| Dataset | Model | PFF Plain | PFF FT | TF Plain | TF FT | JPR Plain | JPR FT |
|---|---|---:|---:|---:|---:|---:|---:|
| Adult | Qwen2-0.5B | 0.00/0.03 | 0.68/0.70 | 0.01/0.05 | 1.00/1.00 | 0.90/0.86 | 0.95/0.98 |
| Adult | Qwen3-0.6B | 0.00/0.00 | 0.76/0.80 | 0.93/0.33 | 0.92/0.94 | 0.98/0.93 | 1.00/1.00 |
| Adult | Llama3-1B | 0.00/0.00 | 0.53/0.48 | 0.08/0.03 | 0.99/1.00 | 0.32/0.36 | 0.72/0.71 |
| Adult | DeepSeek-1.5B | 0.00/0.00 | 0.92/0.91 | 0.53/0.32 | 0.99/0.99 | 0.74/0.66 | 0.98/1.00 |
| Adult | Qwen3-1.7B | 0.27/0.22 | 0.94/0.96 | 1.00/1.00 | 1.00/1.00 | 1.00/1.00 | 1.00/1.00 |
| Adult | Qwen3-30B | 0.88/0.75 | -- | 0.99/0.99 | -- | 0.99/0.99 | -- |
| California | Qwen2-0.5B | 0.00/0.00 | 0.34/0.77 | 0.41/0.06 | 1.00/1.00 | 0.97/0.93 | 0.91/0.96 |
| California | Qwen3-0.6B | 0.00/0.00 | 0.86/0.86 | 0.82/0.37 | 1.00/1.00 | 0.99/0.98 | 1.00/1.00 |
| California | Llama3-1B | 0.00/0.00 | 0.74/0.87 | 0.78/0.58 | 1.00/1.00 | 0.86/0.44 | 0.83/0.72 |
| California | DeepSeek-1.5B | 0.02/0.00 | 0.81/0.91 | 0.86/0.37 | 0.98/1.00 | 0.77/0.68 | 0.98/1.00 |
| California | Qwen3-1.7B | 0.45/0.55 | 0.97/0.99 | 1.00/1.00 | 1.00/1.00 | 0.98/1.00 | 1.00/1.00 |
| California | Qwen3-30B | 0.68/0.73 | -- | 0.99/0.99 | -- | 1.00/1.00 | -- |
| Diabetes | Qwen2-0.5B | 0.00/0.01 | 0.51/0.74 | 0.13/0.13 | 0.70/1.00 | 0.80/0.92 | 0.98/0.99 |
| Diabetes | Qwen3-0.6B | 0.00/0.01 | 0.19/0.83 | 0.99/0.92 | 0.94/0.98 | 0.97/0.86 | 1.00/0.98 |
| Diabetes | Llama3-1B | 0.00/0.00 | 0.69/0.77 | 0.48/0.40 | 0.77/1.00 | 0.63/0.10 | 0.97/0.96 |
| Diabetes | DeepSeek-1.5B | 0.00/0.00 | 0.73/0.91 | 0.81/0.37 | 0.87/1.00 | 0.83/0.72 | 0.99/1.00 |
| Diabetes | Qwen3-1.7B | 0.08/0.09 | 0.80/0.95 | 1.00/1.00 | 0.98/1.00 | 0.98/1.00 | 1.00/1.00 |
| Diabetes | Qwen3-30B | 0.66/0.70 | -- | 1.00/1.00 | -- | 1.00/1.00 | -- |
| Titanic | Qwen2-0.5B | 0.00/0.00 | 0.70/0.72 | 0.07/0.00 | 0.93/1.00 | 0.97/0.97 | 0.98/0.99 |
| Titanic | Qwen3-0.6B | 0.01/0.01 | 0.62/0.96 | 0.52/0.12 | 0.91/1.00 | 0.97/0.97 | 1.00/1.00 |
| Titanic | Llama3-1B | 0.00/0.00 | 0.38/0.55 | 0.12/0.00 | 0.42/1.00 | 0.81/0.27 | 0.75/0.97 |
| Titanic | DeepSeek-1.5B | 0.03/0.01 | 0.84/0.95 | 0.46/0.28 | 0.88/1.00 | 0.71/0.75 | 0.99/1.00 |
| Titanic | Qwen3-1.7B | 0.50/0.46 | 0.84/0.98 | 1.00/1.00 | 0.95/1.00 | 1.00/1.00 | 1.00/1.00 |
| Titanic | Qwen3-30B | 0.80/0.73 | -- | 0.99/0.99 | -- | 0.99/0.99 | -- |

PFF = Perfect Feature Faithfulness; TF = Target Faithfulness; JPR = JSON Parsing Rate.

### LLM narrative-consistency audit

Change Recall (CR) and Value Precision (VP) compare the generated prose with the structured counterfactual evidence. Entries are percentages.

| Pipeline | Qwen2-0.5B CR | VP | Qwen3-0.6B CR | VP | Llama3-1B CR | VP | DeepSeek-1.5B CR | VP | Qwen3-1.7B CR | VP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| w/o Refiner, Plain | 16.3 | 46.5 | 72.0 | 92.0 | 15.8 | 26.3 | 50.0 | 77.3 | 92.5 | 100.0 |
| w/o Refiner, FT | 91.7 | 95.0 | 88.3 | 91.7 | 97.5 | 90.0 | 95.0 | 100.0 | 97.5 | 100.0 |
| w/ Refiner, Plain | 83.3 | 100.0 | 66.7 | 66.7 | 88.0 | 96.0 | 33.3 | 66.7 | 96.7 | 100.0 |
| w/ Refiner, FT | 86.7 | 93.3 | 93.3 | 98.3 | 100.0 | 94.5 | 96.7 | 98.3 | 96.7 | 100.0 |

## Optional interactive dashboard

The repository also includes an interactive interface for selecting a dataset and model, loading factual–counterfactual examples, generating narratives, and comparing the resulting feature and target changes. It is an optional way to run inference and explore outputs; the research pipeline and evaluation scripts remain available independently of the interface. See [webapp/QUICKSTART.md](webapp/QUICKSTART.md) for launch instructions.
