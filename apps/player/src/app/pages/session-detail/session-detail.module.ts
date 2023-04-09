import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { IonicModule } from '@ionic/angular'
import { SessionDetailPage } from './session-detail'
import { SessionDetailPageRoutingModule } from './session-detail-routing.module'

@NgModule({
  imports: [CommonModule, IonicModule, SessionDetailPageRoutingModule],
  declarations: [SessionDetailPage],
})
export class SessionDetailModule {}
