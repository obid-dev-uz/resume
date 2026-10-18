import type { TemplateDef } from "../types";
import "./style.css";

const template: TemplateDef = {
  id: "sidebar",
  name: "Yon panelli",
  description: "Chapda rangli ustun, rasm va aloqa ma'lumotlari",
  layout: "sidebar",
  side: "left",
  header: "side",
  ats: false,
  photo: true,
  keyValueRows: true,
  periodYearOnly: true,
  mainBlocks: ["details"],
};

export default template;
