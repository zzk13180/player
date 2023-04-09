import { Component } from '@angular/core'
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import { defineCustomElements } from 'vidstack/elements'
import { ConferenceData } from '../../providers/conference-data'
import { transmux } from './transmux'

@Component({
  selector: 'page-speaker-list',
  templateUrl: 'speaker-list.html',
  styleUrls: ['./speaker-list.scss'],
})
export class SpeakerListPage {
  speakers: any[] = []

  constructor(public confData: ConferenceData) {}

  // todo
  async doTranscode() {
    const ffmpeg = createFFmpeg({
      log: true,
      progress: (input: any) => {
        const value: number = input.ratio * 100.0
        if (value > 0) {
          console.info(`Completed ${value.toFixed(2)}%`)
        }
      },
    })
    await ffmpeg.load()
    const player = document.querySelector('media-player') as any
    const input = document.querySelector('input[type="file"]') as any
    input.addEventListener('change', async () => {
      const file = input.files[0]
      ffmpeg.FS('writeFile', 'test.ts', await fetchFile(file))
      await ffmpeg.run('-i', 'test.ts', 'test.mp4')
      const data = ffmpeg.FS('readFile', 'test.mp4')
      player.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
      player.play()
    })
  }

  async ngOnInit() {
    await defineCustomElements()
    const player = document.querySelector('media-player') as any
    const input = document.querySelector('input[type="file"]') as any
    const outlet = document.querySelector('media-outlet') as any
    const floatContainer = document.querySelector('.media-float-container') as any
    const floatButton = document.querySelector('.media-float-button') as any
    outlet.onAttach(() => {
      let floating = false
      floatButton.addEventListener('pointerup', () => {
        if (!floating) {
          floatContainer.append(outlet)
        } else {
          player.prepend(outlet)
        }
        floating = !floating
      })
    })

    input.addEventListener('change', () => {
      const file = input.files[0]
      console.log(file)
      if (file.type === 'video/mp4') {
        player.src = URL.createObjectURL(file)
      } else {
        const fr = new FileReader()
        fr.readAsArrayBuffer(file)
        fr.addEventListener('loadend', () => {
          const mediaSource = new MediaSource()
          player.src = URL.createObjectURL(mediaSource)
          mediaSource.addEventListener('sourceopen', async () => {
            const mime = 'video/mp4; codecs="mp4a.40.2,avc1.64001f"'
            const buffer: SourceBuffer = mediaSource.addSourceBuffer(mime)
            const data = await transmux(fr.result as ArrayBuffer)
            buffer.appendBuffer(data)
          })
        })
      }
    })
  }

  ionViewDidEnter() {
    this.confData.getSpeakers().subscribe((speakers: any[]) => {
      this.speakers = speakers
    })
  }
}
