export interface DestinationPhoto {
  id: string;
  source: 'pexels';
  url: string;
  thumbnail: string;
  alt: string;
  width: number;
  height: number;
  credit: { name: string; url: string; providerUrl: string };
}
export interface PhotoSelection { slot: string; photo: DestinationPhoto }
export interface PhotoStatus { searchConfigured: boolean }
export interface PhotoTarget { slot: string; label: string; destination: string }
