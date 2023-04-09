import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'

import { ScheduleModule } from '../schedule/schedule.module'
import { SessionDetailModule } from '../session-detail/session-detail.module'
import { SpeakerDetailModule } from '../speaker-detail/speaker-detail.module'
import { SpeakerListModule } from '../speaker-list/speaker-list.module'
import { TabsPageRoutingModule } from './tabs-page-routing.module'
import { TabsPage } from './tabs-page'

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    ScheduleModule,
    SessionDetailModule,
    SpeakerDetailModule,
    SpeakerListModule,
    TabsPageRoutingModule,
  ],
  declarations: [TabsPage],
})
export class TabsModule {}
