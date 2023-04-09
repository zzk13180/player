import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class UserData {
  favorites: string[] = []
  HAS_LOGGED_IN = 'hasLoggedIn'
  HAS_SEEN_TUTORIAL = 'hasSeenTutorial'

  constructor() {}

  hasFavorite(sessionName: string): boolean {
    return this.favorites.indexOf(sessionName) > -1
  }

  addFavorite(sessionName: string): void {
    this.favorites.push(sessionName)
  }

  removeFavorite(sessionName: string): void {
    const index = this.favorites.indexOf(sessionName)
    if (index > -1) {
      this.favorites.splice(index, 1)
    }
  }
}
