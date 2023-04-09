import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
// import { HomeComponent } from './components/home.component'
import type { Routes } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: '/tutorial',
    pathMatch: 'full',
  },
  {
    path: 'app',
    loadChildren: () =>
      import('./pages/tabs-page/tabs-page.module').then(m => m.TabsModule),
  },
  {
    path: 'tutorial',
    loadChildren: () =>
      import('./pages/tutorial/tutorial.module').then(m => m.TutorialModule),
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
