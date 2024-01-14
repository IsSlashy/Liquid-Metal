import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Board, Task } from './board.model';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  constructor(private afAuth: AngularFireAuth, private db: AngularFirestore) {}

  async createBoard(data: Board): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (user) {
      await this.db.collection('boards').add({
        ...data,
        uid: user.uid,
        tasks: [{ description: 'Hello!', label: 'yellow' }]
      });
    } else {
      throw new Error('User not logged in');
    }
  }

  deleteBoard(boardId: string): Promise<void> {
    return this.db.collection('boards').doc(boardId).delete();
  }

  updateTasks(boardId: string, tasks: Task[]): Promise<void> {
    return this.db.collection('boards').doc(boardId).update({ tasks });
  }

  removeTask(boardId: string, task: Task): Promise<void> {
    return this.db.collection('boards').doc(boardId).update({
      tasks: firebase.firestore.FieldValue.arrayRemove(task)
    });
  }

  getUserBoards(): Observable<Board[] | []> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.db
            .collection<Board>('boards', ref => ref.where('uid', '==', user.uid).orderBy('priority'))
            .valueChanges({ idField: 'id' });
        } else {
          return of([]);
        }
      })
    );
  }

  sortBoards(boards: Board[]): void {
    const db = firebase.firestore();
    const batch = db.batch();
    const refs = boards.map(b => db.collection('boards').doc(b.id));
    refs.forEach((ref, idx) => batch.update(ref, { priority: idx }));
    batch.commit();
    // Consider adding error handling for batch operations
  }
}
