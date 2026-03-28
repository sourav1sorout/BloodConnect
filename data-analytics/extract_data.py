import pandas as pd
from pymongo import MongoClient
import os

# Connect to MongoDB
MONGO_URI = "mongodb://127.0.0.1:27017"
DB_NAME = "bloodDonationDB"

try:
    print(f"🔌 Connecting to MongoDB at {MONGO_URI}...")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    print(f"✅ Connected to database: {DB_NAME}")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    exit(1)

# Ensure datasets directory exists
output_dir = "datasets"
os.makedirs(output_dir, exist_ok=True)

# ------------------------------------------------------------------------------
# 1. EXTRACT DONORS
# ------------------------------------------------------------------------------
print("🩸 Extracting Donors data...")
donors_cursor = db.donors.aggregate([
    {
        "$lookup": {
            "from": "users",           # join with users collection
            "localField": "user",
            "foreignField": "_id",
            "as": "user_info"
        }
    },
    {"$unwind": "$user_info"}         # flatten the array
])

donors_list = list(donors_cursor)

if not donors_list:
    print("⚠️ No donors found in the database.")
else:
    df_donors = pd.DataFrame(donors_list)

    # Flatten nested fields
    df_donors['Name'] = df_donors['user_info'].apply(lambda x: x.get('name', ''))
    df_donors['Email'] = df_donors['user_info'].apply(lambda x: x.get('email', ''))
    df_donors['Phone'] = df_donors['user_info'].apply(lambda x: x.get('phone', ''))
    
    # Flatten address
    df_donors['City'] = df_donors['address'].apply(lambda x: x.get('city', '') if isinstance(x, dict) else '')
    df_donors['State'] = df_donors['address'].apply(lambda x: x.get('state', '') if isinstance(x, dict) else '')
    
    # Rename and select clean columns
    cols_to_keep = {
        'Name': 'Name',
        'Email': 'Email',
        'Phone': 'Phone',
        'bloodGroup': 'Blood Group',
        'age': 'Age',
        'gender': 'Gender',
        'weight': 'Weight (kg)',
        'City': 'City',
        'State': 'State',
        'isAvailable': 'Is Available',
        'isApproved': 'Is Approved',
        'totalDonations': 'Total Donations',
        'createdAt': 'Joined At'
    }
    
    df_donors_clean = df_donors[list(cols_to_keep.keys())].rename(columns=cols_to_keep)
    
    # Save to CSV
    donors_csv_path = os.path.join(output_dir, 'donors_clean.csv')
    df_donors_clean.to_csv(donors_csv_path, index=False)
    print(f"✅ Saved clean Donors dataset ({len(df_donors_clean)} rows) to: {donors_csv_path}")


# ------------------------------------------------------------------------------
# 2. EXTRACT BLOOD REQUESTS
# ------------------------------------------------------------------------------
print("📩 Extracting Blood Requests data...")
# Complex aggregate to get requester names and assigned donor names
requests_cursor = db.bloodrequests.aggregate([
    {
        "$lookup": {
            "from": "users",
            "localField": "requester",
            "foreignField": "_id",
            "as": "requester_info"
        }
    },
    {
        "$lookup": {
            "from": "donors",
            "localField": "donor",
            "foreignField": "_id",
            "as": "donor_info"
        }
    },
    {"$unwind": {"path": "$requester_info", "preserveNullAndEmptyArrays": True}},
    {"$unwind": {"path": "$donor_info", "preserveNullAndEmptyArrays": True}},
    
    # If there is a donor, lookup their user info to get the name
    {
        "$lookup": {
            "from": "users",
            "localField": "donor_info.user",
            "foreignField": "_id",
            "as": "donor_user_info"
        }
    },
    {"$unwind": {"path": "$donor_user_info", "preserveNullAndEmptyArrays": True}}
])

requests_list = list(requests_cursor)

if not requests_list:
    print("⚠️ No blood requests found in the database.")
else:
    df_req = pd.DataFrame(requests_list)

    # Flatten nested fields
    df_req['Requester Name'] = df_req['requester_info'].apply(lambda x: x.get('name', 'Unknown') if isinstance(x, dict) else 'Unknown')
    df_req['Requester Phone'] = df_req['requester_info'].apply(lambda x: x.get('phone', 'Unknown') if isinstance(x, dict) else 'Unknown')
    df_req['Assigned Donor Name'] = df_req['donor_user_info'].apply(lambda x: x.get('name', 'None') if isinstance(x, dict) else 'None')
    
    # Flatten hospital address
    df_req['Hospital Name'] = df_req['hospital'].apply(lambda x: x.get('name', '') if isinstance(x, dict) else '')
    df_req['Hospital City'] = df_req['hospital'].apply(lambda x: x.get('city', '') if isinstance(x, dict) else '')
    
    cols_to_keep_req = {
        'Requester Name': 'Requester Name',
        'Requester Phone': 'Requester Phone',
        'bloodGroup': 'Requested Blood Group',
        'unitsRequired': 'Units Required',
        'urgency': 'Urgency',
        'status': 'Status',
        'Hospital Name': 'Hospital Name',
        'Hospital City': 'Hospital City',
        'Assigned Donor Name': 'Assigned Donor Name',
        'neededBy': 'Needed By Date',
        'createdAt': 'Requested At'
    }

    # Only keep columns that actually exist to avoid KeyError if db is sparse
    existing_cols = [c for c in cols_to_keep_req.keys() if c in df_req.columns]
    
    df_req_clean = df_req[existing_cols].rename(columns={k: cols_to_keep_req[k] for k in existing_cols})
    
    # Save to CSV
    req_csv_path = os.path.join(output_dir, 'requests_clean.csv')
    df_req_clean.to_csv(req_csv_path, index=False)
    print(f"✅ Saved clean Requests dataset ({len(df_req_clean)} rows) to: {req_csv_path}")

print("🎉 ETL Complete! You can now open these CSV files in Excel, Tableau, or Power BI.")
