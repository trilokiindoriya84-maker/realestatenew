export interface Property {
  uniqueId: string;
  slug: string;
  propertyTitle: string;
  propertyDescription: string | null;
  propertyType: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  pincode: string;
  totalArea: string;
  areaUnit: string;
  propertyFacing: string;
  openSides: string;
  eastRoadWidth: string | null;
  westRoadWidth: string | null;
  northRoadWidth: string | null;
  southRoadWidth: string | null;
  sellingPrice: string;
  priceType: string;
  negotiable: string;
  circleRate: string | null;
  publishedPhotos: string[] | null;
  bedrooms: string | null;
  bathrooms: string | null;
  floors: string | null;
  floorNumber: string | null;
  landType: string | null;
  boundaryWall: string | null;
  amenities: any;
  publishedAt: Date | null;
}

export interface PropertyFormData {
  propertyType: string;
  propertyTitle: string;
  propertyDescription: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  pincode: string;
  totalArea: string;
  areaUnit: string;
  sellingPrice: string;
  priceType: string;
  negotiable: string;
}
