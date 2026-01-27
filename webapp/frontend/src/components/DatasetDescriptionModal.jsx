import React from 'react';

const DatasetDescriptionModal = ({ isOpen, onClose, datasetKey }) => {
  // Dataset knowledge base mapping with structured data
  const datasetKB = {
    'titanic': {
      name: 'Titanic',
      intro: 'The Titanic dataset is a classic dataset often used in machine learning and statistical analysis. It contains information about passengers on the Titanic and whether they survived the shipwreck. The dataset is widely used for binary classification tasks (survived or not).',
      features: [
        { name: 'Pclass', description: 'Passenger Class. Indicates the socio-economic class of the passenger. The possible values are 1 (upper class), 2 (middle class), and 3 (lower class).' },
        { name: 'Sex', description: 'Gender of the passenger. The possible values are \'male\' and \'female\'.' },
        { name: 'Age', description: 'Age of the passenger in years. It includes numerical values, which can be fractional for children (e.g., 0.42 for 5 months old). Missing values are represented as NaN.' },
        { name: 'SibSp', description: 'Number of Siblings/Spouses Aboard. This indicates the number of siblings or spouses the passenger had aboard the Titanic. The values are numerical, such as 0, 1, 2, etc.' },
        { name: 'Parch', description: 'Number of Parents/Children Aboard. This indicates the number of parents or children the passenger had aboard the Titanic. The values are numerical, such as 0, 1, 2, etc.' },
        { name: 'Fare', description: 'The fare paid by the passenger. It is represented as numerical values, such as 7.25 or 71.83.' },
        { name: 'Embarked', description: 'The port where the passenger boarded the Titanic. The possible values are \'C\' (Cherbourg), \'Q\' (Queenstown), and \'S\' (Southampton).' },
        { name: 'Survived', description: 'Target Variable. Indicates whether the passenger survived. Possible values are 0 (did not survive) and 1 (survived).', isTarget: true }

      ]
    },
    'adult': {
      name: 'Adult Income',
      intro: 'The Adult dataset, also known as the "Census Income" dataset, is commonly used for machine learning and data mining tasks. It contains information about individuals from the 1994 U.S. Census and is often used for binary classification tasks (income >50K or <=50K).',
      features: [
        { name: 'Age', description: 'The age of the individual. It is represented as numerical values.' },
        { name: 'Workclass', description: 'The type of employment of the individual. Possible values include \'Private\', \'Self-emp-not-inc\', \'Self-emp-inc\', \'Federal-gov\', \'Local-gov\', \'State-gov\', \'Without-pay\', and \'Never-worked\'.' },
        { name: 'Education', description: 'The highest level of education achieved by the individual. Possible values include \'Bachelors\', \'Some-college\', \'11th\', \'HS-grad\', \'Prof-school\', \'Assoc-acdm\', \'Assoc-voc\', \'9th\', \'7th-8th\', \'12th\', \'Masters\', \'1st-4th\', \'10th\', \'Doctorate\', and \'5th-6th\'.' },
        { name: 'Marital-status', description: 'The marital status of the individual. Possible values include \'Married-civ-spouse\', \'Divorced\', \'Never-married\', \'Separated\', \'Widowed\', \'Married-spouse-absent\', and \'Married-AF-spouse\'.' },
        { name: 'Occupation', description: 'The occupation of the individual. Possible values include \'Tech-support\', \'Craft-repair\', \'Other-service\', \'Sales\', \'Exec-managerial\', \'Prof-specialty\', \'Handlers-cleaners\', \'Machine-op-inspct\', \'Adm-clerical\', \'Farming-fishing\', \'Transport-moving\', \'Priv-house-serv\', \'Protective-serv\', and \'Armed-Forces\'.' },
        { name: 'Race', description: 'The race of the individual. Possible values include \'White\', \'Asian-Pac-Islander\', \'Amer-Indian-Eskimo\', \'Other\', and \'Black\'.' },
        { name: 'Gender', description: 'The gender of the individual. Possible values are \'Male\' and \'Female\'.' },
        { name: 'Hours-per-week', description: 'The number of hours worked per week by the individual. It is represented as numerical values.' },
        { name: 'Income', description: 'Target Variable. Indicates whether the individual\'s income is greater than 50K or less than or equal to 50K. Possible values are 1 if income >50K and 0 if income <=50K.', isTarget: true }
      ]
    },
    'california': {
      name: 'California Housing',
      intro: 'The California Housing dataset is a well-known dataset commonly used in machine learning, especially for predictive modeling and classification tasks. It contains aggregated housing information from California districts and is widely used to study socio-economic factors and housing market patterns. In this version of the dataset, the target variable is transformed into a binary label indicating whether the median house value in a block group is above (1) or below (0) the overall median value, making it suitable for binary classification problems.',
      features: [
        { name: 'MedInc', description: 'Median Income. Represents the median income of households in the block group. This feature is numerical and scaled such that a value of 1 corresponds to $10,000 in median income (e.g., 3.5 ≈ $35,000).' },
        { name: 'HouseAge', description: 'Median House Age. Indicates the median age of the houses in the block group in years. The values are numerical, such as 5, 20, or 42.' },
        { name: 'AveRooms', description: 'Average Number of Rooms. Represents the average number of rooms per household in the block group. This is a numerical value obtained by dividing the total number of rooms by the number of households.' },
        { name: 'AveBedrms', description: 'Average Number of Bedrooms. Similar to AveRooms, this indicates the average number of bedrooms per household in the block group. It is represented as a numerical value.' },
        { name: 'Population', description: 'The total population of the block group. This attribute contains numerical values, such as 500, 1520, or 3500.' },
        { name: 'AveOccup', description: 'Average Household Occupancy. Indicates the average number of occupants per household in the block group. It is a numerical value representing household density.' },
        { name: 'Latitude', description: 'The geographical latitude of the block group within California. It is represented as numerical coordinates.' },
        { name: 'Longitude', description: 'The geographical longitude of the block group within California. It is also represented as numerical coordinates.' },
        { name: 'MedHouseVal', description: 'Target Variable. A binary label indicating whether the median house value for the block group is above (1) or below (0) the median of all house values in the dataset.', isTarget: true }
      ]
    },
    'diabetes': {
      name: 'Diabetes',
      intro: 'The Diabetes dataset (LARS) is a clinical dataset commonly used in machine learning. It contains physiological data from 442 diabetes patients, and it focuses on blood serum measurements to solve a binary classification task.',
      features: [
        { name: 'age', description: 'Age of the patient in years.' },
        { name: 'sex', description: 'Biological sex of the patient. The values are \'Male\' and \'Female\'.' },
        { name: 'bmi', description: 'Body Mass Index. A measure of body fat based on height and weight. Values are raw clinical measurements (e.g., 26.9).' },
        { name: 'bp', description: 'Average Blood Pressure. Mean arterial pressure (MAP) measured in mmHg.' },
        { name: 's1', description: 'Total Serum Cholesterol. Total amount of cholesterol in the blood (TC).' },
        { name: 's2', description: 'Low-Density Lipoproteins. Often called \'bad cholesterol\' (LDL).' },
        { name: 's3', description: 'High-Density Lipoproteins. Often called \'good cholesterol\' (HDL).' },
        { name: 's4', description: 'Total Cholesterol / HDL Ratio. A calculated risk factor. Higher values indicate higher risk.' },
        { name: 's5', description: 'Log of Serum Triglycerides. The natural logarithm of the serum triglycerides level. Note: This is on a log scale (e.g., a value of 5.3 corresponds to approx 200 mg/dL).' },
        { name: 's6', description: 'Blood Sugar Level. Fasting blood glucose level (Glu).' },
        { name: 'target', description: 'Disease Progression. Target Variable. Indicates the progression of the disease one year after baseline. The variable is binarized based on the population mean: 0 indicates \'Lower Progression\' (below average, more stable) and 1 indicates \'Higher Progression\' (above average, rapid worsening).', isTarget: true }
      ]
    }
  };

  if (!isOpen || !datasetKey) return null;

  const datasetData = datasetKB[datasetKey];
  if (!datasetData) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 theme-modal-backdrop backdrop-blur-md animate-fade-in"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-3xl max-h-[85vh] theme-modal-bg theme-modal-border rounded-2xl overflow-hidden shadow-elevated animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 theme-modal-header-bg theme-modal-header-border border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl theme-accent-icon-bg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold theme-modal-title">{datasetData.name} Dataset</h3>
                <p className="text-xs theme-modal-subtitle">Dataset schema and attributes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center theme-modal-close-btn transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Introduction */}
          <div className="mb-6">
            <p className="theme-modal-intro leading-relaxed">{datasetData.intro}</p>
          </div>

          {/* Features Section */}
          <div>
            <h4 className="text-sm font-semibold theme-modal-section-title uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Dataset Attributes
            </h4>
            <div className="space-y-3">
              {datasetData.features.map((feature, index) => (
                <div 
                  key={feature.name}
                  className={`p-4 rounded-xl border transition-colors theme-modal-feature-card ${
                    feature.isTarget 
                      ? 'theme-modal-feature-target' 
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-mono font-medium ${
                      feature.isTarget 
                        ? 'theme-feature-badge-target' 
                        : 'theme-feature-badge'
                    }`}>
                      {feature.name}
                      {feature.isTarget && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider opacity-80">target</span>
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-sm theme-modal-feature-desc leading-relaxed pl-0.5">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetDescriptionModal;
