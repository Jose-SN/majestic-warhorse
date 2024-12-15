import { Injectable } from '@angular/core';
import { RegistrationApiService } from 'src/app/services/api-service/registration-api.service';
import { CommonApiService } from 'src/app/shared/api-service/common-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { IRegistrationModel } from './model/registration-model';
import { Subject, takeUntil } from 'rxjs';

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
          next: (imageUrl) => {
            this.imageUrl = imageUrl?.['url'];
            resolve({
              success: true,
              url: this.imageUrl,
            });
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
    registrationInfo.profileImage = encodeURI(this.imageUrl);
    registrationInfo.phone = registrationInfo.phone;
    delete registrationInfo.confirmPassword;
    return new Promise((resolve) => {
      this.registrationApiService
        .saveUserInfo({
          ...registrationInfo,
        })
        .pipe(takeUntil(_destroy$))
        .subscribe({
          next: (userAdded) => {
            if (userAdded.success) {
              this.showToasterMessage(
                'User Information successfully saved',
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
    const response = await fetch(url);             // Fetch the file from the URL
    const blob = await response.blob();            // Convert response to Blob
    return new File([blob], fileName, { type: blob.type }); // Create a File object
  }
}
