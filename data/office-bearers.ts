export type OfficeBearer = {
  id: string;
  name: string;
  designation: string;
  image: string;
  order: number;
};

export const officeBearers: OfficeBearer[] = [
  {
    id: "president",
    name: "Hon. Shri Akash Vijayvargiya Ji",
    designation: "President",
    image: "/images/office-bearers/akash-vijayvargiya.jpg",
    order: 1,
  },
  {
    id: "chairman",
    name: "Shri Sanjay Lunawat Ji",
    designation: "Chairman",
    image: "/images/office-bearers/sanjay-lunawat.jpg",
    order: 2,
  },
  {
    id: "secretary",
    name: "Shri Devashish Nilosey Ji",
    designation: "Secretary",
    image: "/images/office-bearers/devashish-nilosey.jpg",
    order: 3,
  },
];