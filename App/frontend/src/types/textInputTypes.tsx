export interface InputText {
  description?: string;
  textId: string;
  jsonData: InputTextContent;
}
export interface InputTextContent {
  myField: string;
  myEscapedUrl?: string;
}
