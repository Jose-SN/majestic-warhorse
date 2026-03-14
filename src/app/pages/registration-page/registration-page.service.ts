import { Injectable } from '@angular/core';
import { RegistrationApiService } from 'src/app/services/api-service/registration-api.service';
import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonApiService } from 'src/app/shared/api-service/common-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { IRegistrationModel } from './model/registration-model';
import type { OrganizationCreatePayload } from 'src/app/models/organization.model';
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
    private organizationApiService: OrganizationApiService,
    private authService: AuthService,
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
    registrationInfo: IRegistrationModel,
    isEditMode: boolean = false
  ): Promise<boolean> {
    registrationInfo.profileImage = this.commonService.decodeUrl(encodeURI(this.imageUrl));
    delete registrationInfo.confirmPassword;
    
    const shouldInclude = (value: any): boolean =>
      value !== null && value !== undefined && value !== '';

    const isOrganization = registrationInfo.role === 'organization';

    let transformedPayload: any;

    if (isOrganization && !isEditMode) {
      const contact: OrganizationCreatePayload['contact'] = {};
      if (shouldInclude(registrationInfo.email)) {
        contact.email = registrationInfo.email!;
      }
      if (shouldInclude(registrationInfo.phone)) {
        contact.phone = registrationInfo.phone!;
      }
      const orgPayload: OrganizationCreatePayload = {
        name: registrationInfo.name || registrationInfo.firstName || '',
        contact,
        password: registrationInfo.password || '',
      };
      if (shouldInclude(registrationInfo.profileImage)) {
        orgPayload.profile_image = registrationInfo.profileImage;
      }
      // app_id required for organization creation
      let appId = sessionStorage.getItem('app_id');
      if (!appId) {
        try {
          const app = JSON.parse(sessionStorage.getItem('application') || '{}');
          appId = app?.id || null;
        } catch {
          appId = null;
        }
      }
      if (appId) {
        orgPayload.app_id = appId;
      }
      transformedPayload = orgPayload;
    } else {
      // User payload
      transformedPayload = {};
      if (shouldInclude(registrationInfo.firstName)) {
        transformedPayload.first_name = registrationInfo.firstName;
      }
      if (shouldInclude(registrationInfo.lastName)) {
        transformedPayload.last_name = registrationInfo.lastName;
      }
      if (shouldInclude(registrationInfo.profileImage)) {
        transformedPayload.profile_image = registrationInfo.profileImage;
      }
      const contact: any = {};
      if (shouldInclude(registrationInfo.email)) {
        contact.email = registrationInfo.email;
      }
      if (shouldInclude(registrationInfo.phone)) {
        contact.phone = registrationInfo.phone;
      }
      if (Object.keys(contact).length > 0) {
        transformedPayload.contact = contact;
      }
      if (shouldInclude(registrationInfo.role)) {
        transformedPayload.role = registrationInfo.role;
      } else if (!isEditMode) {
        transformedPayload.role = 'student';
      }
      if (shouldInclude(registrationInfo.password)) {
        transformedPayload.password = registrationInfo.password;
      }
      if (!isEditMode) {
        transformedPayload.status = 'pending';
      } else {
        const loginedUser = this.commonService.loginedUserInfo;
        if (loginedUser?.id) {
          transformedPayload.id = loginedUser.id;
        }
        transformedPayload.status = loginedUser?.status || 'active';
      }
      if (shouldInclude(registrationInfo.organization_id)) {
        transformedPayload.organization_id = registrationInfo.organization_id;
      }
      const applicationData = sessionStorage.getItem('application');
      if (applicationData) {
        try {
          const appData = JSON.parse(applicationData);
          if (appData.id) {
            transformedPayload.app_id = appData.id;
          }
        } catch {
          // ignore
        }
      }
      if (shouldInclude(registrationInfo.app_id)) {
        transformedPayload.app_id = registrationInfo.app_id;
      }
    }

    return new Promise((resolve) => {
      if (isEditMode) {
        // Edit mode: use organization API when logged in as organization, else user API
        const loginedUser = this.commonService.loginedUserInfo;
        const isOrgEdit = loginedUser?.role === 'organization';
        if (isOrgEdit) {
          const contact: Record<string, string> = {};
          if (shouldInclude(registrationInfo.email)) contact['email'] = registrationInfo.email!;
          if (shouldInclude(registrationInfo.phone)) contact['phone'] = registrationInfo.phone!;
          const orgUpdatePayload: any = {
            id: loginedUser.id,
            name: registrationInfo.name || loginedUser.name || '',
            contact: Object.keys(contact).length ? contact : (loginedUser.contact ?? {}),
            profile_image: registrationInfo.profileImage,
          };
          if (shouldInclude(registrationInfo.password)) {
            orgUpdatePayload.password = registrationInfo.password;
          }
          this.organizationApiService
            .update(orgUpdatePayload)
            .pipe(takeUntil(_destroy$))
            .subscribe({
              next: () => {
                this.showToasterMessage('Account updated successfully', TOASTER_MESSAGE_TYPE.SUCCESS);
                resolve(true);
              },
              error: (errorHandler) => {
                if (errorHandler?.errors?.length) {
                  errorHandler.errors.forEach((err: { [key: string]: string }) => {
                    this.showToasterMessage(err['msg'], TOASTER_MESSAGE_TYPE.ERROR);
                  });
                } else {
                  this.showToasterMessage('Error while updating...', TOASTER_MESSAGE_TYPE.ERROR);
                }
              },
            });
        } else {
          this.authService
            .updateUserInfo(transformedPayload)
            .pipe(takeUntil(_destroy$))
            .subscribe({
              next: (userUpdated) => {
                if (userUpdated) {
                  this.showToasterMessage('Account updated successfully', TOASTER_MESSAGE_TYPE.SUCCESS);
                  resolve(true);
                } else {
                  this.showToasterMessage('Error while updating...', TOASTER_MESSAGE_TYPE.ERROR);
                }
              },
              error: (errorHandler) => {
                if (errorHandler?.errors?.length) {
                  errorHandler.errors.forEach((error: { [key: string]: string }) => {
                    this.showToasterMessage(error['msg'], TOASTER_MESSAGE_TYPE.ERROR);
                  });
                } else {
                  this.showToasterMessage('Error while updating...', TOASTER_MESSAGE_TYPE.ERROR);
                }
              },
            });
        }
      } else {
        // Organization API requires app_id in header
        if (isOrganization) {
          let appId = sessionStorage.getItem('app_id');
          if (!appId) {
            try {
              const app = JSON.parse(sessionStorage.getItem('application') || '{}');
              appId = app?.id || null;
            } catch {
              appId = null;
            }
          }
          if (!appId) {
            this.showToasterMessage(
              'Application not loaded. Please refresh the page and try again.',
              TOASTER_MESSAGE_TYPE.ERROR
            );
            resolve(false);
            return;
          }
        }
        const apiService = isOrganization
          ? this.organizationApiService
          : this.registrationApiService;
        apiService
          .saveUserInfo(transformedPayload)
          .pipe(takeUntil(_destroy$))
          .subscribe({
            next: (userAdded) => {
              if (userAdded) {
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
      }
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
