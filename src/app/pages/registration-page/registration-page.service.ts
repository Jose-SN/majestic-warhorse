import { Injectable } from '@angular/core';
import { RegistrationApiService } from 'src/app/services/api-service/registration-api.service';
import { CommonApiService } from 'src/app/shared/api-service/common-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { IRegistrationModel } from './model/registration-model';
import { Subject, takeUntil } from 'rxjs';
import { HttpEventType } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class RegistrationPageService {
  public imageUrl: string = '';
  public MAX_FILE_SIZE: number = 5 * 1024 * 1024; // 5 MB
  public ALLOWED_FILE_TYPES: string[] = ['image/png', 'image/jpeg', 'image/jpg'];
  constructor(
    private registrationApiService: RegistrationApiService,
    private commonApiService: CommonApiService,
    private commonService: CommonService
  ) {}

  public onFileSelected(
    _destroy$: Subject<void>,
    selectedFile: File
  ): Promise<{ [key: string]: string | boolean }> {
    const formData: FormData = new FormData();
    formData.append('file', selectedFile);
    return new Promise((resolve) => {
      if (!this.ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
        resolve({
          success: true,
          message: 'Only PNG and JPEG files are allowed!',
        });
      }
      if (selectedFile.size > this.MAX_FILE_SIZE) {
        resolve({
          success: true,
          message: 'File size should not exceed 5MB!',
        });
      }
      this.commonApiService
        .uploadImage(formData)
        .pipe(takeUntil(_destroy$))
        .subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              const uploadedCourse = Math.round((100 * event.loaded) / event.total);
              console.log(uploadedCourse);
            } else if (event.type === HttpEventType.Response) {
              this.imageUrl = event?.body?.['url'];
              resolve({
                success: true,
                url: this.imageUrl,
              });
            }
          },
          error: () => {
            resolve({
              success: false,
              message: 'Error while uploading image, please re-upload',
            });
          },
        });
    });
  }
  public registerUserInfo(
    _destroy$: Subject<void>,
    registrationInfo: IRegistrationModel
  ): Promise<boolean> {
    registrationInfo.profileImage = this.commonService.decodeUrl(encodeURI(this.imageUrl));
    delete registrationInfo.confirmPassword;
    
    // Transform payload to match database schema
    const transformedPayload: any = {
      first_name: registrationInfo.firstName || '',
      last_name: registrationInfo.lastName || null,
      profile_image: registrationInfo.profileImage || '',
      password: registrationInfo.password || '',
      contact: {
        email: registrationInfo.email || '',
        phone: registrationInfo.phone || '',
      },
      role: registrationInfo.role || 'student',
      status: 'pending', // Default status as per schema
    };

    // Add app_id if available from sessionStorage
    const applicationData = sessionStorage.getItem('application');
    if (applicationData) {
      try {
        const appData = JSON.parse(applicationData);
        if (appData.id) {
          transformedPayload.app_id = appData.id;
        }
      } catch (e) {
        console.error('Error parsing application data:', e);
      }
    }

    // Add app_id if provided in registration info (for organization registration)
    if (registrationInfo.app_id) {
      transformedPayload.app_id = registrationInfo.app_id;
    }

    return new Promise((resolve) => {
      this.registrationApiService
        .saveUserInfo(transformedPayload)
        .pipe(takeUntil(_destroy$))
        .subscribe({
          next: (userAdded) => {debugger
            if (userAdded.success) {
              this.showToasterMessage(
                'User registered successfully',
                TOASTER_MESSAGE_TYPE.SUCCESS
              );
              resolve(true);
            } else {
              this.showToasterMessage('Error while saving...', TOASTER_MESSAGE_TYPE.ERROR);
            }
          },
          error: (errorHandler) => {
            if (errorHandler?.errors?.length) {
              errorHandler.errors.forEach((error: { [key: string]: string }) => {
                this.showToasterMessage(error['msg'], TOASTER_MESSAGE_TYPE.ERROR);
              });
            } else {
              this.showToasterMessage('Error while saving...', TOASTER_MESSAGE_TYPE.ERROR);
            }
          },
        });
    });
  }
  private showToasterMessage(message: string, messageType: string) {
    this.commonService.openToaster({
      message: message,
      messageType: messageType,
    });
  }
  async convertUrlToFile(url: string, fileName: string): Promise<File> {
    const response = await fetch(url); // Fetch the file from the URL
    const blob = await response.blob(); // Convert response to Blob
    return new File([blob], fileName, { type: blob.type }); // Create a File object
  }
}
