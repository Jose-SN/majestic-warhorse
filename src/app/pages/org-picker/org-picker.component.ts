import { CommonModule } from '@angular/common';

import { Component, OnInit } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import { firstValueFrom } from 'rxjs';

import {

  PostLoginWorkflowService,

  RoleIntent,

} from 'src/app/core/auth/post-login-workflow.service';

import { UserOrganizationEntry } from 'src/app/models/organization-picker.model';

import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';

import { AuthService } from 'src/app/services/api-service/auth.service';

import { CommonService } from 'src/app/shared/services/common.service';

import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

import { decodeText } from 'src/app/shared/utils/utils';



@Component({

  selector: 'app-org-picker',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './org-picker.component.html',

  styleUrl: './org-picker.component.scss',

})

export class OrgPickerComponent implements OnInit {

  organizations: UserOrganizationEntry[] = [];

  loading = true;

  submitting = false;

  isSwitchMode = false;

  activeOrgId = '';

  selectedOrgId: string | null = null;

  selectedRole: RoleIntent | null = null;



  constructor(

    private organizationApi: OrganizationApiService,

    private postLoginWorkflow: PostLoginWorkflowService,

    private authService: AuthService,

    private commonService: CommonService,

    private router: Router,

    private route: ActivatedRoute

  ) {}



  ngOnInit(): void {

    if (!this.authService.isLoggedIn()) {

      this.router.navigate(['/login']);

      return;

    }



    this.isSwitchMode = this.route.snapshot.queryParamMap.get('switch') === 'true';

    this.activeOrgId = sessionStorage.getItem('organization_id') || '';

    const pendingRole = sessionStorage.getItem('pendingRoleIntent') as RoleIntent | null;

    if (pendingRole === 'teacher' || pendingRole === 'student') {

      this.selectedRole = pendingRole;

    }

    this.loadOrganizations();

  }



  private async loadOrganizations(): Promise<void> {

    this.loading = true;

    try {

      const cached = sessionStorage.getItem('pendingUserOrganizations');

      if (cached) {

        this.organizations = JSON.parse(cached) as UserOrganizationEntry[];

      } else {

        const user = this.commonService.loginedUserInfo ?? this.readUserFromSession();

        const res: any = await firstValueFrom(

          this.organizationApi.listOrganizationsForUser({

            userId: user?.id,

            email: user?.email || user?.contact?.email,

          })

        );

        const data = res?.data ?? res ?? [];

        const list = Array.isArray(data) ? data : [];

        this.organizations = list

          .map((entry: any) => ({

            id: entry.organization?.id ?? entry.id ?? '',

            name: entry.organization?.name ?? entry.name ?? 'Unnamed organization',

            email: entry.organization?.contact?.email ?? entry.contact?.email,

            membershipRole: entry.membership?.role ?? entry.role,

          }))

          .filter((o: UserOrganizationEntry) => !!o.id);

      }



      if (this.organizations.length === 1 && !this.isSwitchMode) {

        this.selectedOrgId = this.organizations[0].id;

      }



      if (!this.organizations.length) {

        sessionStorage.removeItem('needsOrgPicker');

        this.commonService.openToaster({

          message: 'No organizations found for your account.',

          messageType: TOASTER_MESSAGE_TYPE.ERROR,

        });

        this.router.navigate(['/dashboard/approval-pending'], {

          state: {

            infoMessage: 'No organization is linked to your account. Please contact your administrator.',

          },

        });

      }

    } catch {

      this.commonService.openToaster({

        message: 'Unable to load your organizations. Please try again.',

        messageType: TOASTER_MESSAGE_TYPE.ERROR,

      });

    } finally {

      this.loading = false;

    }

  }



  displayName(name: string): string {

    return decodeText(name);

  }



  pickOrganization(orgId: string): void {

    if (this.submitting) return;



    if (this.isSwitchMode) {

      this.switchOrganization(orgId);

      return;

    }



    this.selectedOrgId = orgId;

  }



  pickRole(role: RoleIntent): void {

    if (this.submitting || this.isSwitchMode) return;

    this.selectedRole = role;

  }



  canContinue(): boolean {

    return !!this.selectedOrgId && !!this.selectedRole && !this.submitting;

  }



  async continueToDashboard(): Promise<void> {

    if (!this.canContinue() || !this.selectedOrgId || !this.selectedRole) return;

    await this.completeSelection(this.selectedOrgId, this.selectedRole);

  }



  private async switchOrganization(orgId: string): Promise<void> {

    if (this.submitting) return;

    this.submitting = true;

    try {

      const org = this.organizations.find((o) => o.id === orgId);

      if (org?.name) {

        sessionStorage.setItem('activeOrganizationName', org.name);

      }

      sessionStorage.removeItem('pendingUserOrganizations');

      await this.postLoginWorkflow.selectOrganization(orgId, { skipRouting: true });

      this.commonService.openToaster({

        message: 'Organization switched successfully.',

        messageType: TOASTER_MESSAGE_TYPE.SUCCESS,

      });

      await this.postLoginWorkflow.continueRoutingForCurrentUser();

    } catch (error: any) {

      this.commonService.openToaster({

        message: error?.message || 'Unable to select organization.',

        messageType: TOASTER_MESSAGE_TYPE.ERROR,

      });

    } finally {

      this.submitting = false;

    }

  }



  private async completeSelection(orgId: string, role: RoleIntent): Promise<void> {

    this.submitting = true;

    try {

      const org = this.organizations.find((o) => o.id === orgId);

      if (org?.name) {

        sessionStorage.setItem('activeOrganizationName', org.name);

      }

      await this.postLoginWorkflow.selectOrganization(orgId, { roleIntent: role });

    } catch (error: any) {

      this.commonService.openToaster({

        message: error?.message || 'Unable to join organization. Please try again.',

        messageType: TOASTER_MESSAGE_TYPE.ERROR,

      });

    } finally {

      this.submitting = false;

    }

  }



  cancelSwitch(): void {

    this.router.navigate(['/dashboard/overview']);

  }



  private readUserFromSession() {

    try {

      const raw = sessionStorage.getItem('login_details');

      return raw ? JSON.parse(raw) : null;

    } catch {

      return null;

    }

  }

}

