import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './auth.guard/guards/auth.guard';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { RegistrationPageComponent } from './pages/registration-page/registration-page.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { CourseOverviewComponent } from './pages/course-overview/course-overview.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { CourseDetailsComponent } from './pages/course-details/course-details.component';
import { EditAccountComponent } from './pages/edit-account/edit-account.component';
import { TeachersListComponent } from './pages/teachers-list/teachers-list.component';
import { StudentsListComponent } from './pages/students-list/students-list.component';
import { ApprovalListComponent } from './pages/approval-list/approval-list.component';
import { ApprovalPendingComponent } from './pages/approval-pending/approval-pending.component';
import { StudentTeacherAssignListComponent } from './pages/student-teacher-assign-list/student-teacher-assign-list.component';
import { QuestionnaireComponent } from './pages/questionnaire/questionnaire.component';
import { UnderConstructionComponent } from './components/under-construction/under-construction.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { OrgPickerComponent } from './pages/org-picker/org-picker.component';
import { InviteTeacherComponent } from './pages/invite-teacher/invite-teacher.component';
import { InviteStudentComponent } from './pages/invite-student/invite-student.component';
import { StudentApprovalListComponent } from './pages/student-approval-list/student-approval-list.component';
import { AiModeComponent } from './pages/ai-mode/ai-mode.component';
import { CourseUploadComponent } from './pages/course-upload/course-upload.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginPageComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'forgetpassword', component: ForgotPasswordComponent },
  { path: 'signup', component: RegistrationPageComponent },
  { path: 'org-picker', component: OrgPickerComponent, canActivate: [authGuard] },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: DashboardOverviewComponent },
      { path: 'ai-mode', component: AiModeComponent },
      { path: 'course-overview', component: CourseOverviewComponent },
      { path: 'courses', component: CoursesComponent },
      { path: 'course-upload', component: CourseUploadComponent },
      { path: 'course-details', component: CourseDetailsComponent },
      { path: 'account', component: EditAccountComponent },
      { path: 'teachers', component: TeachersListComponent },
      { path: 'students', component: StudentsListComponent },
      { path: 'approval', component: ApprovalListComponent },
      { path: 'student-approval', component: StudentApprovalListComponent },
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
