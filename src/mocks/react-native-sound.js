// Mock for react-native-sound in web environment

class Sound {
  constructor(filename, basePath, callback) {
    this.filename = filename;
    this.basePath = basePath;
    this._loaded = false;
    this._playing = false;
    this._duration = 0;
    this._currentTime = 0;
    
    setTimeout(() => {
      this._loaded = true;
      if (callback) callback(null, this);
    }, 100);
  }

  static setCategory(category, mixWithOthers = false) {
    console.warn('Sound.setCategory called in web environment:', category);
  }

  play(callback) {
    console.warn('Sound.play called in web environment for:', this.filename);
    this._playing = true;
    if (callback) callback(true);
    return this;
  }

  pause(callback) {
    console.warn('Sound.pause called in web environment for:', this.filename);
    this._playing = false;
    if (callback) callback();
    return this;
  }

  stop(callback) {
    console.warn('Sound.stop called in web environment for:', this.filename);
    this._playing = false;
    this._currentTime = 0;
    if (callback) callback();
    return this;
  }

  release() {
    console.warn('Sound.release called in web environment for:', this.filename);
    this._loaded = false;
    return this;
  }

  getDuration() {
    return this._duration;
  }

  getCurrentTime(callback) {
    if (callback) callback(this._currentTime);
    return this._currentTime;
  }

  setCurrentTime(time) {
    this._currentTime = time;
    return this;
  }

  setVolume(volume) {
    console.warn('Sound.setVolume called in web environment:', volume);
    return this;
  }

  isLoaded() {
    return this._loaded;
  }

  isPlaying() {
    return this._playing;
  }
}

export default Sound;