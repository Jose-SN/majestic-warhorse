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
  private imageUrl: string = '';
  public MAX_FILE_SIZE: number = 5 * 1024 * 1024; // 5 MB
  public ALLOWED_FILE_TYPES: string[] = ['image/png', 'image/jpeg', 'image/jpg'];
  constructor(
    private registrationApiService: RegistrationApiService,
    private commonApiService: CommonApiService,
    private commonService: CommonService
  ) {}

  public onFileSelected(_destroy$: Subject<void>, selectedFile: File): string | null {
    if (!this.ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      return 'Only PNG and JPEG files are allowed!';
    }
    if (selectedFile.size > this.MAX_FILE_SIZE) {
      return 'File size should not exceed 5MB!';
    }
    const formData: FormData = new FormData();
    formData.append('file', selectedFile);
    this.commonApiService
      .uploadImage(formData)
      .pipe(takeUntil(_destroy$))
      .subscribe({
        next: (imageUrl) => {
          this.imageUrl = imageUrl?.['url'];
        },
        error: () => {
          this.commonService.openToaster({
            message: 'Error while uploading image, please re-upload',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        },
      });
    return null;
  }
  public registerUserInfo(
    _destroy$: Subject<void>,
    registrationInfo: IRegistrationModel
  ): Promise<boolean> {
    registrationInfo.image = this.imageUrl;
    delete registrationInfo.confirmPassword;
    return new Promise((resolve) => {
      this.registrationApiService
        .saveUserInfo({
          ...registrationInfo,
          ...{ firstname: registrationInfo.userName, role: 'guest' },
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
          error: () => {
            this.showToasterMessage('Error while saving...', TOASTER_MESSAGE_TYPE.ERROR);
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
}
