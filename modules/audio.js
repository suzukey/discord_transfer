const { Readable } = require("stream")
const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe])

class Silence extends Readable {
  _read() {
    this.push(SILENCE_FRAME)
    this.destroy()
  }
}

class Audio {
  stream = null

  constructor() {
    this.stream = new Silence()
  }

  static conbine = (audio_streams) => {}
}

module.exports = { Audio, Silence }
