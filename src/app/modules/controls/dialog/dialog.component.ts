import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

export enum eDialogButtonType {
  Ok,
  Yes,
  No
}

export class DialogButton {
  constructor(public label: string, public type: eDialogButtonType) {

  }
}

export class DialogData {
  constructor(public title: string, public text: string, public buttons: DialogButton[]) {
  }
}

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<DialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {
  }

  btnClick(btn: DialogButton): void {
    this.dialogRef.close(btn);
  }

  ngOnInit(): void {
  }

}
