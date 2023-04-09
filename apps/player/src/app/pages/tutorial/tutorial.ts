import { Component, ChangeDetectorRef } from '@angular/core'
import { Router } from '@angular/router'

import { MenuController } from '@ionic/angular'

import Swiper from 'swiper'

@Component({
  selector: 'page-tutorial',
  templateUrl: 'tutorial.html',
  styleUrls: ['./tutorial.scss'],
})
export class TutorialPage {
  showSkip = true
  private slides: Swiper | null = null

  constructor(
    public menu: MenuController,
    public router: Router,
    private cd: ChangeDetectorRef,
  ) {}

  startApp() {
    this.router.navigateByUrl('/app/tabs/schedule', { replaceUrl: true })
  }

  setSwiperInstance(swiper: Swiper) {
    this.slides = swiper
  }

  onSlideChangeStart() {
    this.showSkip = !this.slides?.isEnd
    this.cd.detectChanges()
  }

  ionViewWillEnter() {
    // if ('ion_did_tutorial' === true) {
    //   this.router.navigateByUrl('/app/tabs/schedule', { replaceUrl: true });
    // }

    this.menu.enable(false)
  }

  ionViewDidLeave() {
    // enable the root left menu when leaving the tutorial page
    this.menu.enable(true)
  }
}
