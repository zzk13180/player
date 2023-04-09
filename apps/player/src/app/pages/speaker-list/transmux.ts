import muxjs from 'mux.js'

const transmuxer = new muxjs.mp4.Transmuxer()

export function transmux(arraybuffer: ArrayBuffer): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const segment = new Uint8Array(arraybuffer)
    const remuxedSegments: any = []
    let len = 0
    let initSegment: any
    transmuxer.on('data', (e: any) => {
      remuxedSegments.push(e)
      len += e.data.byteLength
      // eslint-disable-next-line prefer-destructuring
      initSegment = e.initSegment
    })
    transmuxer.on('done', () => {
      let offset = 0
      const bytes = new Uint8Array(initSegment.byteLength + len)
      bytes.set(initSegment, offset)
      offset += initSegment.byteLength
      for (let j = 0, i = offset; j < remuxedSegments.length; j++) {
        bytes.set(remuxedSegments[j].data, i)
        i += remuxedSegments[j].byteLength
      }
      resolve(bytes)
    })
    transmuxer.push(segment)
    transmuxer.flush()
  })
}
