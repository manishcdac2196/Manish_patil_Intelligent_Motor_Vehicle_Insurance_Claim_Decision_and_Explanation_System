import pandas as pd
import os
from functools import lru_cache

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "clustered_clauses.csv")

class DataLoader:
    _instance = None
    _data = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataLoader, cls).__new__(cls)
        return cls._instance

    def load_data(self):
        if self._data is None:
            if os.path.exists(DATA_PATH):
                # Optimize: Load only necessary columns
                # schema: doc_name, section, nlp_text, cluster
                try:
                    self._data = pd.read_csv(DATA_PATH, usecols=["doc_name", "section", "nlp_text", "cluster"])
                    # normalize column names just in case
                    self._data.columns = [c.lower() for c in self._data.columns]
                    print(f"Loaded {len(self._data)} clauses for analytics.")
                except Exception as e:
                    print(f"Error loading analytics data: {e}")
                    self._data = pd.DataFrame()
            else:
                print(f"Warning: Analytics data not found at {DATA_PATH}")
                self._data = pd.DataFrame()
        return self._data

    def get_data(self):
        if self._data is None:
            return self.load_data()
        return self._data

# Singleton accessor
loader = DataLoader()

def get_analytics_df():
    return loader.get_data()
