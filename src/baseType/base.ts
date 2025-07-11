export type Tag1 = "DIRECT_ONLY" | "SPLASH";
export type Tag2 = "SOCIAL_ENGINEERING" | "WEB_ATTACK" | "SYSTEM_EXPLOIT";
export type Tag3 = "CHAINABLE" | "PERSISTENT";

export interface Effect {
  name: string;
  args: Record<string, string | number>;
}
export interface AttackCardData {
  id: number;
  type: "attack";
  name: string;
  description: string;

  attack: number;
  _tempAttack?: number; //临时攻击力

  tag1: Tag1;
  tag2: Tag2;
  tag3?: Tag3;
  link: Tag2;
  linkEffect: Effect[];
  duration: number;
}
export interface DefenseCardData {
  id: number;
  type: "defense";
  name: string;
  description: string;

  defense: number;
  _tempDefense?: number; //临时防御力
  health: number;
  buffTagert: Tag2;
  buffEffect: Effect[];
}
export interface SpecialCardData {
  id: number;
  type: "special";
  name: string;
  description: string;

  effect: Effect[];
}

export type CardData = AttackCardData | DefenseCardData | SpecialCardData;
