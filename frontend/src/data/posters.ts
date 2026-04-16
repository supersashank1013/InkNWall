export interface Poster {
  id: number;
  name: string;
  cat: string;
  price: number;
  img: string;
  isPremium?: boolean;
}

export const posters: Poster[] = [
  { id: 1, name: "Spider-Man 2099", cat: "marvel", price: 249, img: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=400" },
  { id: 2, name: "Gojo Unlimited", cat: "anime", price: 299, img: "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=400" },
  { id: 3, name: "Verstappen RB19", cat: "f1", price: 349, img: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=400" },
  { id: 4, name: "Messi Miami", cat: "sports", price: 249, img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400" },
  { id: 5, name: "Interstellar Space", cat: "movies", price: 249, img: "https://images.unsplash.com/photo-1506318137071-a8e063b4b519?q=80&w=400" },
  { id: 6, name: "Ramen Culture", cat: "food", price: 199, img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400" },
  { id: 7, name: "Success Quote", cat: "quotes", price: 199, img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400" }
];