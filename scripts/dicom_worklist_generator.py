#!/usr/bin/env python3
"""
DICOM Worklist Generator for Orthanc
Creates proper DICOM worklist files using pydicom
"""

import os
import sys
import json
import datetime
from pathlib import Path

try:
    import pydicom
    from pydicom.dataset import Dataset, FileDataset
    from pydicom.uid import generate_uid
except ImportError:
    print("Error: pydicom is required. Install with: pip install pydicom")
    sys.exit(1)


class OrthancWorklistGenerator:
    def __init__(self, worklist_dir="worklists"):
        self.worklist_dir = Path(worklist_dir)
        self.worklist_dir.mkdir(exist_ok=True)
    
    def create_worklist(self, worklist_data):
        """Create a DICOM worklist file from the provided data"""
        try:
            # Create main dataset
            ds = Dataset()
            
            # Patient Information
            ds.PatientName = worklist_data.get('patientName', '')
            ds.PatientID = worklist_data.get('patientId', '')
            ds.PatientBirthDate = self._format_date(worklist_data.get('patientBirthDate', ''))
            ds.PatientSex = worklist_data.get('patientSex', 'U')
            
            # Study Information
            ds.StudyInstanceUID = worklist_data.get('studyInstanceUID', generate_uid())
            ds.AccessionNumber = worklist_data.get('accessionNumber', '')
            ds.StudyDescription = worklist_data.get('studyDescription', '')
            
            # Requested Procedure Information
            ds.RequestedProcedureDescription = worklist_data.get('requestedProcedureDescription', '')
            ds.RequestedProcedureID = worklist_data.get('accessionNumber', '')
            
            # Institution Information
            ds.InstitutionName = worklist_data.get('institutionName', 'Hasta Radiologi')
            ds.InstitutionalDepartmentName = worklist_data.get('departmentName', 'Radiology')
            
            # Referring Physician
            if worklist_data.get('referringPhysician'):
                ds.ReferringPhysicianName = worklist_data['referringPhysician']
            
            # Scheduled Procedure Step Sequence
            sps = Dataset()
            sps.Modality = worklist_data.get('modality', 'CR')
            sps.ScheduledStationAETitle = worklist_data.get('scheduledStationAETitle', 'ORTHANC')
            sps.ScheduledProcedureStepStartDate = self._format_date(worklist_data.get('scheduledDate', ''))
            sps.ScheduledProcedureStepStartTime = self._format_time(worklist_data.get('scheduledTime', ''))
            sps.ScheduledProcedureStepDescription = worklist_data.get('scheduledProcedureStepDescription', '')
            sps.ScheduledProcedureStepID = worklist_data.get('accessionNumber', '') + '_SPS'
            
            if worklist_data.get('performingPhysician'):
                sps.ScheduledPerformingPhysicianName = worklist_data['performingPhysician']
            
            # Add the scheduled procedure step to the sequence
            ds.ScheduledProcedureStepSequence = [sps]
            
            # Create file meta information
            file_meta = Dataset()
            file_meta.MediaStorageSOPClassUID = "1.2.840.10008.5.1.4.31"  # Basic Worklist Information Model
            file_meta.MediaStorageSOPInstanceUID = generate_uid()
            file_meta.ImplementationClassUID = "1.2.826.0.1.3680043.8.498.1"
            file_meta.ImplementationVersionName = "HASTA_RADIOLOGI_1.0"
            file_meta.TransferSyntaxUID = "1.2.840.10008.1.2"  # Implicit VR Little Endian
            
            # Create filename
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            accession = worklist_data.get('accessionNumber', 'UNK')
            filename = f"{accession}_{timestamp}.wl"
            filepath = self.worklist_dir / filename
            
            # Create FileDataset
            file_dataset = FileDataset(
                str(filepath),
                {},
                file_meta=file_meta,
                preamble=b"\0" * 128
            )
            
            # Update with main dataset
            file_dataset.update(ds)
            
            # Set transfer syntax properties
            file_dataset.is_little_endian = True
            file_dataset.is_implicit_VR = True
            
            # Save the file
            file_dataset.save_as(str(filepath))
            
            return {
                'success': True,
                'filename': filename,
                'filepath': str(filepath),
                'size': filepath.stat().st_size
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _format_date(self, date_str):
        """Format date to DICOM format (YYYYMMDD)"""
        if not date_str:
            return datetime.datetime.now().strftime("%Y%m%d")
        
        try:
            # Try parsing different date formats
            for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"]:
                try:
                    date_obj = datetime.datetime.strptime(date_str, fmt)
                    return date_obj.strftime("%Y%m%d")
                except ValueError:
                    continue
            
            # If all formats fail, return current date
            return datetime.datetime.now().strftime("%Y%m%d")
            
        except Exception:
            return datetime.datetime.now().strftime("%Y%m%d")
    
    def _format_time(self, time_str):
        """Format time to DICOM format (HHMMSS)"""
        if not time_str:
            return datetime.datetime.now().strftime("%H%M%S")
        
        try:
            # Remove colons and format
            time_clean = time_str.replace(":", "")
            if len(time_clean) == 4:  # HHMM
                time_clean += "00"  # Add seconds
            elif len(time_clean) == 6:  # HHMMSS
                pass
            else:
                # Invalid format, use current time
                return datetime.datetime.now().strftime("%H%M%S")
            
            return time_clean
            
        except Exception:
            return datetime.datetime.now().strftime("%H%M%S")
    
    def create_batch(self, worklists_data):
        """Create multiple worklist files"""
        results = []
        for worklist_data in worklists_data:
            result = self.create_worklist(worklist_data)
            results.append(result)
        return results
    
    def list_worklists(self):
        """List all worklist files"""
        try:
            files = list(self.worklist_dir.glob("*.wl"))
            file_info = []
            
            for file_path in files:
                stat = file_path.stat()
                file_info.append({
                    'filename': file_path.name,
                    'filepath': str(file_path),
                    'size': stat.st_size,
                    'created': stat.st_ctime,
                    'modified': stat.st_mtime
                })
            
            return {
                'success': True,
                'count': len(file_info),
                'files': file_info
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_worklist(self, filename):
        """Delete a worklist file"""
        try:
            filepath = self.worklist_dir / filename
            if filepath.exists():
                filepath.unlink()
                return {'success': True}
            else:
                return {'success': False, 'error': 'File not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}


def main():
    """Command line interface"""
    if len(sys.argv) < 2:
        print("Usage: python dicom_worklist_generator.py <json_file>")
        print("       python dicom_worklist_generator.py --sample")
        sys.exit(1)
    
    generator = OrthancWorklistGenerator()
    
    if sys.argv[1] == "--sample":
        # Create sample worklist
        sample_data = {
            'patientId': 'P123456',
            'patientName': 'DOE^JOHN^MIDDLE',
            'patientBirthDate': '1985-05-15',
            'patientSex': 'M',
            'accessionNumber': 'ACC123456',
            'studyDescription': 'Chest X-Ray',
            'scheduledDate': datetime.datetime.now().strftime("%Y-%m-%d"),
            'scheduledTime': '14:30',
            'modality': 'CR',
            'scheduledStationAETitle': 'ORTHANC',
            'scheduledProcedureStepDescription': 'Chest X-Ray PA and Lateral',
            'requestedProcedureDescription': 'Chest X-Ray - Routine',
            'referringPhysician': 'DR^SMITH^ROBERT',
            'performingPhysician': 'DR^JOHNSON^MARY',
            'institutionName': 'Hasta Radiologi',
            'departmentName': 'Radiology'
        }
        
        result = generator.create_worklist(sample_data)
        if result['success']:
            print(f"✅ Sample worklist created: {result['filename']}")
            print(f"📁 File path: {result['filepath']}")
            print(f"📊 File size: {result['size']} bytes")
        else:
            print(f"❌ Error: {result['error']}")
    
    else:
        # Load from JSON file
        try:
            with open(sys.argv[1], 'r') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                # Batch creation
                results = generator.create_batch(data)
                success_count = sum(1 for r in results if r['success'])
                print(f"✅ Created {success_count}/{len(results)} worklist files")
                
                for i, result in enumerate(results):
                    if result['success']:
                        print(f"  {i+1}. {result['filename']} ({result['size']} bytes)")
                    else:
                        print(f"  {i+1}. Error: {result['error']}")
            
            else:
                # Single creation
                result = generator.create_worklist(data)
                if result['success']:
                    print(f"✅ Worklist created: {result['filename']}")
                    print(f"📁 File path: {result['filepath']}")
                    print(f"📊 File size: {result['size']} bytes")
                else:
                    print(f"❌ Error: {result['error']}")
        
        except FileNotFoundError:
            print(f"❌ Error: File '{sys.argv[1]}' not found")
        except json.JSONDecodeError:
            print(f"❌ Error: Invalid JSON in file '{sys.argv[1]}'")
        except Exception as e:
            print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    main()
