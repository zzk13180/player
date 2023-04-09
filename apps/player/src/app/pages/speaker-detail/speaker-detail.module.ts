import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { IonicModule } from '@ionic/angular'
import { SpeakerDetailPage } from './speaker-detail'
import { SpeakerDetailPageRoutingModule } from './speaker-detail-routing.module'

@NgModule({
  imports: [CommonModule, IonicModule, SpeakerDetailPageRoutingModule],
  declarations: [SpeakerDetailPage],
})
export class SpeakerDetailModule {}
