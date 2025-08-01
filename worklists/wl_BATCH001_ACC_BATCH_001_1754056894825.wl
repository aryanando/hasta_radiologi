# DICOM Worklist File
# Generated: 2025-08-01T14:01:34.825Z

# Patient Information
(0010,0020) BATCH001                                    # Patient ID
(0010,0010) BATCH^PATIENT^ONE                                  # Patient Name
(0010,0030) 19900101                             # Patient Birth Date
(0010,0040) M                                   # Patient Sex

# Study Information
(0020,000D) 1.2.826.0.1.3680043.8.498.1754056894825.7405                             # Study Instance UID
(0008,0050) ACC_BATCH_001                              # Accession Number
(0008,1030) Test Chest X-Ray                             # Study Description

# Scheduled Procedure Step Information
(0040,0100)[0].(0008,0060) CR                      # Modality
(0040,0100)[0].(0040,0001) ORTHANC       # Scheduled Station AE Title
(0040,0100)[0].(0040,0002) 20250802                 # Scheduled Procedure Step Start Date
(0040,0100)[0].(0040,0003) 100000                 # Scheduled Procedure Step Start Time
(0040,0100)[0].(0040,0007) Test Chest X-Ray PA and Lateral # Scheduled Procedure Step Description

# Requested Procedure Information
(0032,1060) Test Chest X-Ray - Routine                # Requested Procedure Description

# Physician Information
(0008,0090) DR^TEST^REFERRING                           # Referring Physician Name
(0040,0100)[0].(0040,0006) DR^TEST^PERFORMING           # Scheduled Performing Physician Name

# Institution Information
(0008,0080) Hasta Radiologi                              # Institution Name
(0008,1040) Radiology                               # Institution Department Name

# Worklist Information
(0040,1001) ACC_BATCH_001                              # Requested Procedure ID
(0040,0009) 1.2.826.0.1.3680043.8.498.1754056894825.6687                                # Scheduled Procedure Step ID
