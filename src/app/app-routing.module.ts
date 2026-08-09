import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './auth.guard/guards/auth.guard';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { RegistrationPageComponent } from './pages/registration-page/registration-page.component';
import { HowItWorksPageComponent } from './pages/how-it-works-page/how-it-works-page.component';
import { WebsitePageComponent } from './pages/website-page/website-page.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { CourseOverviewComponent } from './pages/course-overview/course-overview.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { CourseDetailsComponent } from './pages/course-details/course-details.component';
import { DirectoryPageComponent } from './pages/directory-page/directory-page.component';
import { ApprovalPageComponent } from './pages/approval-page/approval-page.component';
import { ApprovalPendingComponent } from './pages/approval-pending/approval-pending.component';
import { StudentTeacherAssignListComponent } from './pages/student-teacher-assign-list/student-teacher-assign-list.component';
import { QuestionnaireComponent } from './pages/questionnaire/questionnaire.component';
import { UnderConstructionComponent } from './components/under-construction/under-construction.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { OrgPickerComponent } from './pages/org-picker/org-picker.component';
import { InviteTeacherComponent } from './pages/invite-teacher/invite-teacher.component';
import { InviteStudentComponent } from './pages/invite-student/invite-student.component';
import { AiModeComponent } from './pages/ai-mode/ai-mode.component';
import { CourseUploadComponent } from './pages/course-upload/course-upload.component';
import { ViewAssignedStudentsComponent } from './components/view-assigned-students/view-assigned-students.component';
import { ViewAssignedTeachersComponent } from './components/view-assigned-teachers/view-assigned-teachers.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { PricingPageComponent } from './pages/pricing-page/pricing-page.component';
import { LibraryPageComponent } from './pages/library-page/library-page.component';

/**
 * App shell (DashboardComponent) wraps authenticated pages at the root.
 * Overview lives at `/dashboard`; all other pages are flat (`/courses`, `/settings`, …).
 */
const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'forgetpassword', component: ForgotPasswordComponent },
  { path: 'signup', component: RegistrationPageComponent },
  { path: 'how-it-works', component: HowItWorksPageComponent },
  { path: 'website', component: WebsitePageComponent },
  { path: 'org-picker', component: OrgPickerComponent, canActivate: [authGuard] },
  {
    path: '',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardOverviewComponent },
      { path: 'overview', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'ai-mode', component: AiModeComponent },
      { path: 'course-overview', component: CourseOverviewComponent },
      { path: 'courses', component: CoursesComponent },
      { path: 'course-upload', component: CourseUploadComponent },
      { path: 'course-details', component: CourseDetailsComponent },
      { path: 'settings', component: SettingsPageComponent },
      { path: 'settings/:tab', component: SettingsPageComponent },
      { path: 'account', redirectTo: 'settings/account', pathMatch: 'full' },
      { path: 'customize-app', redirectTo: 'settings/customize', pathMatch: 'full' },
      { path: 'pricing', component: PricingPageComponent },
      { path: 'library', component: LibraryPageComponent },
      { path: 'directory/teachers/:id/manage', component: ViewAssignedStudentsComponent },
      { path: 'directory/students/:id/manage', component: ViewAssignedTeachersComponent },
      { path: 'directory', component: DirectoryPageComponent },
      { path: 'directory/:tab', component: DirectoryPageComponent },
      { path: 'teachers', redirectTo: 'directory/teachers' },
      { path: 'students', redirectTo: 'directory/students' },
      { path: 'approval', component: ApprovalPageComponent },
      { path: 'approval/:tab', component: ApprovalPageComponent },
      { path: 'student-approval', redirectTo: 'approval/students' },
      { path: 'approval-pending', component: ApprovalPendingComponent },
      { path: 'assign-teacher', component: StudentTeacherAssignListComponent },
      { path: 'invite-teacher', component: InviteTeacherComponent },
      { path: 'invite-student', component: InviteStudentComponent },
      { path: 'assessment', component: QuestionnaireComponent },
      { path: '**', component: UnderConstructionComponent },
    ],
  },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
