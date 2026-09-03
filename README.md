# Spatial Protein Expression Prediction from Histology Images

Machine learning analysis of spatial protein-expression data and corresponding histology image patches using dimensionality reduction, statistical modelling, ensemble learning, and convolutional neural networks.

This project explores whether visual patterns in tissue image patches can be used to understand and predict spatial protein expression across different biological specimens.

## Overview

The dataset contains spatially aligned histology image patches and expression measurements for **38 proteins** across four specimens:

* A1
* B1
* C1
* D1

Each spatial location is associated with:

* tissue coordinates,
* a corresponding histology image patch,
* specimen metadata,
* expression measurements for 38 proteins.

The main experiments investigate the relationship between the **image feature space** and the **protein-expression feature space**, followed by supervised models for predicting individual and multiple proteins directly from image data.

## Project Objectives

The project addresses four main areas:

1. Explore shared structure between histology images and protein-expression measurements.
2. Identify latent patterns within image and protein feature spaces.
3. Investigate statistical relationships between staining intensity and protein expression.
4. Predict protein expression from image information using classical machine learning and deep learning.

## Dataset

The experiments use **9,921 spatial samples** with corresponding expression measurements and image patches.

| Split         | Specimens      | Samples |
| ------------- | -------------- | ------: |
| Training      | A1, B1, C1     |   8,168 |
| Held-out Test | D1             |   1,753 |
| Total         | A1, B1, C1, D1 |   9,921 |

Each sample contains expression values for **38 proteins**.

For image-based modelling, histology patches are converted to grayscale and resized to **32 × 32 pixels**, producing 1,024 image features per sample for the classical machine-learning experiments.

## Methods

### 1. Image and Protein Feature Spaces

Protein-expression measurements are standardised using `StandardScaler`.

Histology images are:

1. loaded from the corresponding spatial location,
2. converted to RGB when necessary,
3. converted to grayscale,
4. resized to 32 × 32 pixels,
5. flattened into 1,024-dimensional feature vectors,
6. standardised using statistics calculated only from the training specimens.

This produces:

* **38 protein features**
* **1,024 image features**

for every aligned spatial sample.

---

## 2. Principal Component Analysis

Principal Component Analysis (PCA) is applied independently to image and protein features to study their intrinsic dimensionality.

The number of principal components required to retain approximately **90% of the variance** was:

| Feature Space      | Original Dimensions | Components for ~90% Variance |
| ------------------ | ------------------: | ---------------------------: |
| Protein Expression |                  38 |                           20 |
| Image Features     |               1,024 |                          336 |

The analysis includes:

* scree plots,
* cumulative explained-variance plots,
* PCA projections,
* comparisons between image and protein feature structure.

---

## 3. Latent Topic Discovery with NMF

Non-negative Matrix Factorisation (NMF) is used as an unsupervised method for identifying latent patterns within both feature spaces.

Four latent components are extracted independently from:

* protein-expression features,
* image features.

For protein-expression data, the most influential proteins within each latent component are identified.

For image features, each NMF component is reshaped back into a **32 × 32 image patch**, allowing the extracted visual patterns to be interpreted spatially.

The samples are also visualised in PCA space according to their dominant NMF component.

---

## 4. Histological Staining and cMYC Expression

The project investigates whether hematoxylin staining intensity is associated with **cMYC protein expression**.

Images are transformed into **HED colour space**, separating:

* Hematoxylin (H)
* Eosin (E)
* DAB (D)

channels.

Mean H-channel intensity is extracted from each image patch and compared with cMYC expression.

Statistical analysis includes:

* Pearson correlation,
* Spearman correlation,
* linear regression,
* multivariate regression controlling for specimen identity.

After accounting for specimen-level differences, H-channel intensity remained statistically significant in the fitted regression model.

---

## 5. Random Forest Prediction of CDK4

A `RandomForestRegressor` is trained to predict **CDK4 expression** from PCA-reduced image features.

The model is trained on specimens **A1–C1** and evaluated on the completely held-out specimen **D1**.

### Held-out D1 Performance

| Metric               |    Result |
| -------------------- | --------: |
| RMSE                 |     1.484 |
| Pearson Correlation  |     0.546 |
| Spearman Correlation | **0.618** |
| R²                   |    -0.790 |

Despite the negative R² on the unseen specimen, the model shows a meaningful monotonic relationship between predicted and measured CDK4 expression, with a Spearman correlation of approximately **0.62**.

This experiment highlights the difficulty of generalising biological-expression predictions across different specimens.

---

## 6. CNN Prediction of cMYC

A convolutional neural network is implemented in **PyTorch** to predict cMYC expression directly from the 32 × 32 image patches.

### Architecture

The network contains:

* 2 convolutional layers,
* ReLU activations,
* max-pooling layers,
* a 128-unit fully connected layer,
* a single regression output.

The network is optimised using:

* Mean Squared Error loss,
* Adam optimiser,
* learning rate of `0.001`,
* 20 training epochs.

### Held-out D1 Performance

| Metric               |    Result |
| -------------------- | --------: |
| RMSE                 |     1.839 |
| Pearson Correlation  |     0.519 |
| Spearman Correlation | **0.532** |
| R²                   |    -0.539 |

The CNN captures a moderate relationship between tissue appearance and cMYC expression on an unseen specimen.

---

## 7. Multi-Target Protein Prediction

The project is extended from single-protein regression to simultaneous prediction of **all 38 proteins**.

A multi-output CNN is trained with 38 regression outputs.

Rather than relying on a single train/test split, model generalisation is evaluated using **Leave-One-Specimen-Out Cross-Validation**.

For each fold:

1. one specimen is held out,
2. the remaining three specimens are used for training,
3. the model predicts all 38 proteins for the unseen specimen,
4. RMSE, Pearson correlation, Spearman correlation and R² are calculated.

The process is repeated for:

* A1
* B1
* C1
* D1

Results are then reported as the mean and standard deviation across the four folds.

Example mean results include:

| Protein |  RMSE | Pearson | Spearman |     R² |
| ------- | ----: | ------: | -------: | -----: |
| CDK4    | 1.117 |   0.415 |    0.406 | -0.044 |
| cMYC    | 1.391 |   0.446 |    0.274 | -0.099 |

The cross-validation experiment demonstrates that prediction performance varies substantially between proteins and specimens, highlighting the challenges of cross-specimen biological generalisation.

## Technologies

### Machine Learning

* scikit-learn
* Random Forest Regression
* Principal Component Analysis
* Non-negative Matrix Factorisation
* K-Means
* StandardScaler

### Deep Learning

* PyTorch
* Convolutional Neural Networks
* Multi-output regression

### Statistical Analysis

* Statsmodels
* Pearson correlation
* Spearman correlation
* Linear regression
* Multivariate regression

### Image Processing

* scikit-image
* RGB → HED colour decomposition
* grayscale conversion
* image resizing

### Data & Visualisation

* Python
* Pandas
* NumPy
* Matplotlib

## Repository Structure

```text
spatial-protein-expression-prediction/
│
├── ML_Assignment_2_Solutions.ipynb
├── README.md
└── requirements.txt
```

The image dataset is downloaded when running the notebook and is therefore not stored directly in this repository.

## Installation

Clone the repository:

```bash
git clone https://github.com/<your-username>/spatial-protein-expression-prediction.git
cd spatial-protein-expression-prediction
```

Install the required Python packages:

```bash
pip install pandas numpy matplotlib scikit-learn scikit-image scipy statsmodels torch
```

Then open the notebook using Jupyter:

```bash
jupyter notebook ML_Assignment_2_Solutions.ipynb
```

The notebook was originally developed in a notebook environment with GPU support available for the PyTorch experiments.

## Key Takeaways

* Histology images and protein-expression measurements contain measurable underlying structure that can be explored using PCA and NMF.
* Protein-expression data is considerably more compact than raw image features under PCA.
* Image-derived information can provide useful signals for predicting individual protein-expression levels.
* Random Forest modelling achieved a **Spearman correlation of approximately 0.62 for CDK4** on the held-out D1 specimen.
* A CNN trained directly on image patches achieved a **Spearman correlation of approximately 0.53 for cMYC** on the held-out specimen.
* Leave-One-Specimen-Out evaluation reveals substantial distribution shifts between biological specimens.
* Cross-specimen evaluation is therefore important when assessing models intended to generalise to unseen biological samples.

## Future Improvements

Potential extensions include:

* hyperparameter optimisation for the Random Forest and CNN models,
* larger or pretrained CNN architectures,
* data augmentation,
* transfer learning,
* incorporating spatial coordinates into the predictive models,
* modelling relationships between neighbouring tissue spots,
* graph neural networks for spatial relationships,
* specimen-aware normalisation,
* improved methods for handling cross-specimen distribution shift,
* multimodal architectures combining image, spatial and metadata features.

## Author

**Dev Srivastava**

MSc Computer Science
University of Warwick

## Academic Context

This repository contains machine-learning coursework completed as part of my MSc Computer Science studies at the **University of Warwick**.

The repository is published as a portfolio project to demonstrate work involving dimensionality reduction, statistical modelling, classical machine learning, image analysis and deep learning.
