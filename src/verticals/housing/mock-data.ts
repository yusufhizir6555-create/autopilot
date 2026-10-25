import type { CityKey } from "./cities";
import type { Extra } from "./schema";

/**
 * 30 Beispielanzeigen. Koordinaten sind Versatz in km zum Stadtzentrum,
 * "inDays" ist der Bezugstermin relativ zum Importzeitpunkt.
 */
export type MockRow = {
  id: string;
  city: CityKey;
  district: string;
  street: string;
  title: string;
  rooms: number;
  area: number;
  cold: number;
  extras: Extra[];
  km: [number, number];
  inDays: number;
};

export const mockRows: MockRow[] = [
  { id: "B-1001", city: "berlin", district: "Prenzlauer Berg", street: "Kastanienallee 41", title: "Helle Altbauwohnung mit Balkon", rooms: 2, area: 62, cold: 890, extras: ["balcony", "kitchen"], km: [2.1, 1.8], inDays: 30 },
  { id: "B-1002", city: "berlin", district: "Neukölln", street: "Weserstraße 112", title: "2-Zimmer im Szenekiez", rooms: 2, area: 54, cold: 720, extras: ["kitchen"], km: [3.0, -3.2], inDays: 14 },
  { id: "B-1003", city: "berlin", district: "Charlottenburg", street: "Kantstraße 77", title: "Großzügige 3-Zimmer-Wohnung, Aufzug", rooms: 3, area: 91, cold: 1450, extras: ["elevator", "balcony", "kitchen"], km: [-5.9, -0.8], inDays: 45 },
  { id: "B-1004", city: "berlin", district: "Friedrichshain", street: "Boxhagener Str. 25", title: "Single-Wohnung nahe Boxi", rooms: 1, area: 38, cold: 560, extras: [], km: [4.2, -0.6], inDays: 7 },
  { id: "B-1005", city: "berlin", district: "Pankow", street: "Florastraße 9", title: "Familienwohnung mit Garten", rooms: 4, area: 108, cold: 1520, extras: ["garden", "pets", "parking"], km: [1.0, 6.5], inDays: 60 },
  { id: "B-1006", city: "berlin", district: "Spandau", street: "Seegefelder Str. 140", title: "Ruhige 3-Zimmer am Stadtrand", rooms: 3, area: 78, cold: 820, extras: ["balcony", "parking"], km: [-14.5, 1.2], inDays: 21 },
  { id: "B-1007", city: "berlin", district: "Kreuzberg", street: "Graefestraße 18", title: "Dachgeschoss mit Terrasse", rooms: 2.5, area: 74, cold: 1290, extras: ["balcony", "elevator", "kitchen"], km: [1.6, -2.1], inDays: 35 },
  { id: "B-1008", city: "berlin", district: "Wedding", street: "Müllerstraße 51", title: "Renovierte 2-Zimmer, Haustiere ok", rooms: 2, area: 57, cold: 690, extras: ["pets"], km: [-1.8, 3.9], inDays: 10 },
  { id: "B-1009", city: "berlin", district: "Lichtenberg", street: "Frankfurter Allee 230", title: "Barrierefreie Wohnung mit Aufzug", rooms: 2, area: 60, cold: 640, extras: ["elevator", "barrierFree", "balcony"], km: [7.5, -0.3], inDays: 28 },
  { id: "B-1010", city: "berlin", district: "Schöneberg", street: "Akazienstraße 3", title: "Charmante 1,5-Zimmer", rooms: 1.5, area: 46, cold: 780, extras: ["kitchen"], km: [-2.4, -3.5], inDays: 18 },
  { id: "H-2001", city: "hamburg", district: "Eimsbüttel", street: "Osterstraße 88", title: "Altbau-Perle in Eimsbüttel", rooms: 3, area: 84, cold: 1380, extras: ["balcony", "kitchen"], km: [-2.6, 2.0], inDays: 40 },
  { id: "H-2002", city: "hamburg", district: "Barmbek", street: "Fuhlsbüttler Str. 210", title: "Moderne 2-Zimmer mit Einbauküche", rooms: 2, area: 58, cold: 890, extras: ["kitchen", "elevator"], km: [3.8, 3.2], inDays: 20 },
  { id: "H-2003", city: "hamburg", district: "Altona", street: "Bahrenfelder Str. 64", title: "Kleine Wohnung nahe Ottensen", rooms: 1, area: 33, cold: 610, extras: [], km: [-4.5, 0.4], inDays: 9 },
  { id: "H-2004", city: "hamburg", district: "Wilhelmsburg", street: "Veringstraße 31", title: "Viel Platz für die Familie", rooms: 4, area: 102, cold: 1190, extras: ["balcony", "pets"], km: [1.2, -5.8], inDays: 55 },
  { id: "H-2005", city: "hamburg", district: "Winterhude", street: "Mühlenkamp 12", title: "Wohnen am Kanal mit Balkon", rooms: 2.5, area: 70, cold: 1240, extras: ["balcony", "elevator"], km: [1.9, 3.6], inDays: 33 },
  { id: "M-3001", city: "muenchen", district: "Schwabing", street: "Hohenzollernstraße 60", title: "2-Zimmer in Schwabing", rooms: 2, area: 55, cold: 1390, extras: ["kitchen", "balcony"], km: [0.4, 2.9], inDays: 25 },
  { id: "M-3002", city: "muenchen", district: "Sendling", street: "Plinganserstraße 22", title: "Ruhige Hofwohnung", rooms: 3, area: 76, cold: 1690, extras: ["kitchen"], km: [-1.5, -2.8], inDays: 50 },
  { id: "M-3003", city: "muenchen", district: "Giesing", street: "Tegernseer Landstr. 98", title: "Kompakte 1-Zimmer mit Aufzug", rooms: 1, area: 31, cold: 840, extras: ["elevator", "kitchen"], km: [1.6, -2.5], inDays: 12 },
  { id: "M-3004", city: "muenchen", district: "Pasing", street: "Landsberger Str. 480", title: "Familienwohnung mit Stellplatz", rooms: 4, area: 98, cold: 2150, extras: ["parking", "balcony", "garden"], km: [-8.2, -0.4], inDays: 70 },
  { id: "M-3005", city: "muenchen", district: "Haidhausen", street: "Weißenburger Str. 15", title: "Altbau mit Stuck in Haidhausen", rooms: 2.5, area: 68, cold: 1620, extras: ["balcony"], km: [1.4, -0.6], inDays: 38 },
  { id: "K-4001", city: "koeln", district: "Ehrenfeld", street: "Venloer Str. 300", title: "2-Zimmer in Ehrenfeld", rooms: 2, area: 59, cold: 780, extras: ["kitchen"], km: [-3.0, 0.9], inDays: 15 },
  { id: "K-4002", city: "koeln", district: "Südstadt", street: "Severinstraße 120", title: "Großzügige Südstadt-Wohnung", rooms: 3, area: 88, cold: 1150, extras: ["balcony", "elevator"], km: [0.5, -1.6], inDays: 42 },
  { id: "K-4003", city: "koeln", district: "Deutz", street: "Deutzer Freiheit 70", title: "Rheinnah mit Balkon", rooms: 2, area: 63, cold: 940, extras: ["balcony", "kitchen", "pets"], km: [1.4, 0.0], inDays: 27 },
  { id: "K-4004", city: "koeln", district: "Nippes", street: "Neusser Str. 205", title: "Gemütliche 1-Zimmer", rooms: 1, area: 36, cold: 520, extras: [], km: [0.2, 3.1], inDays: 6 },
  { id: "K-4005", city: "koeln", district: "Porz", street: "Hauptstraße 410", title: "Wohnung mit Garten am Stadtrand", rooms: 3, area: 82, cold: 890, extras: ["garden", "parking", "pets"], km: [6.4, -8.9], inDays: 48 },
  { id: "L-5001", city: "leipzig", district: "Südvorstadt", street: "Karl-Liebknecht-Str. 95", title: "Altbau an der Karli", rooms: 2, area: 61, cold: 530, extras: ["balcony", "kitchen"], km: [0.3, -1.9], inDays: 22 },
  { id: "L-5002", city: "leipzig", district: "Plagwitz", street: "Karl-Heine-Str. 58", title: "Loft-Charakter am Kanal", rooms: 3, area: 95, cold: 780, extras: ["elevator", "balcony"], km: [-3.5, -0.8], inDays: 36 },
  { id: "L-5003", city: "leipzig", district: "Gohlis", street: "Georg-Schumann-Str. 140", title: "Familienfreundlich mit Garten", rooms: 4, area: 110, cold: 890, extras: ["garden", "pets", "parking"], km: [-0.9, 2.8], inDays: 58 },
  { id: "L-5004", city: "leipzig", district: "Connewitz", street: "Wolfgang-Heinze-Str. 20", title: "Kleine 1,5-Zimmer im Grünen", rooms: 1.5, area: 41, cold: 390, extras: [], km: [0.5, -3.8], inDays: 11 },
  { id: "L-5005", city: "leipzig", district: "Zentrum-Ost", street: "Dresdner Str. 31", title: "Neubau barrierefrei, zentral", rooms: 2, area: 64, cold: 720, extras: ["elevator", "barrierFree", "kitchen", "balcony"], km: [0.9, 0.2], inDays: 31 },
];
