import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station } from '../types/station';
import { geocodeAddress } from '../utils/geocodingService';
import { getStationCoordinates } from '../utils/districtCoordinates';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for active stations
const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for inactive stations
const inactiveIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for user location (blue)
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface StationMapProps {
  stations: Station[];
  searchLocation?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// Component to handle geocoding and zooming to location
const MapViewController: React.FC<{
  stations: (Station & { distance?: number })[];
  searchLocation?: string;
  userLocation: UserLocation | null;
}> = ({ stations, searchLocation, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    const handleMapView = async () => {
      const validStations = stations.filter(s => s.latitude && s.longitude);
      const locationsToFit: Array<[number, number]> = [];

      // Add user location if available
      if (userLocation) {
        locationsToFit.push([userLocation.latitude, userLocation.longitude]);
      }

      // Add station locations
      validStations.forEach(s => {
        if (s.latitude && s.longitude) {
          locationsToFit.push([s.latitude, s.longitude]);
        }
      });

      // If there's a search location, try to geocode it using Mapbox
      if (searchLocation && searchLocation.trim()) {
        try {
          const query = `${searchLocation}, Vietnam`;
          const result = await geocodeAddress(query, {
            country: 'vn',
            types: ['district', 'place', 'locality'],
            proximity: [106.6297, 10.8231]
          });

          if (result) {
            if (result.bbox && result.bbox.length === 4) {
              const bounds = L.latLngBounds(
                [result.bbox[1], result.bbox[0]],
                [result.bbox[3], result.bbox[2]]
              );
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            } else {
              map.setView([result.latitude, result.longitude], 13);
            }
            return;
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }

      // Fit bounds to include user location and stations
      if (locationsToFit.length > 0) {
        const bounds = L.latLngBounds(locationsToFit);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: userLocation ? 13 : 12
        });
      }
    };

    const timer = setTimeout(() => {
      handleMapView();
    }, 100);

    return () => clearTimeout(timer);
  }, [stations, searchLocation, map, userLocation]);

  return null;
};

const StationMap: React.FC<StationMapProps> = ({ stations, searchLocation }) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Request user location on component mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          setLocationError(error.message);
          setIsLoadingLocation(false);
          console.warn('Geolocation error:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Trình duyệt không hỗ trợ định vị');
    }
  }, []);

  // Add coordinates to all stations and calculate distances
  const stationsWithCoords = React.useMemo(() => {
    const stationsWithCoordinates = stations.map((station, index) => {
      const coords = getStationCoordinates(station, index);
      let distance: number | undefined;

      // Calculate distance from user location if available
      if (userLocation && coords.latitude && coords.longitude) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          coords.latitude,
          coords.longitude
        );
      }

      return {
        ...station,
        latitude: coords.latitude,
        longitude: coords.longitude,
        distance
      };
    });

    return stationsWithCoordinates;
  }, [stations, userLocation]);

  // Sort stations by distance if user location is available
  const sortedStations = React.useMemo(() => {
    if (userLocation) {
      return [...stationsWithCoords].sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }
    return stationsWithCoords;
  }, [stationsWithCoords, userLocation]);

  // Filter stations that have valid coordinates
  const validStations = sortedStations.filter(s => s.latitude && s.longitude);

  // Default center (Ho Chi Minh City or user location)
  const defaultCenter: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [10.8231, 106.6297];

  if (stations.length === 0) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500 text-lg mb-2">Không có trạm nào để hiển thị</p>
        <p className="text-gray-400 text-sm">Vui lòng thử lại hoặc điều chỉnh bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg relative">
      {/* Location status indicator */}
      {isLoadingLocation && (
        <div className="absolute top-4 left-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-md">
          <p className="text-sm text-gray-600">Đang lấy vị trí của bạn...</p>
        </div>
      )}
      {locationError && !userLocation && (
        <div className="absolute top-4 left-4 z-[1000] bg-yellow-50 px-4 py-2 rounded-lg shadow-md border border-yellow-200">
          <p className="text-sm text-yellow-800">Không thể lấy vị trí: {locationError}</p>
        </div>
      )}
      {userLocation && (
        <div className="absolute top-4 left-4 z-[1000] bg-blue-50 px-4 py-2 rounded-lg shadow-md border border-blue-200">
          <p className="text-sm text-blue-800 font-semibold">✓ Đang hiển thị vị trí của bạn</p>
          <p className="text-xs text-blue-600 mt-1">
            📍 Hiển thị <strong>{validStations.length} trạm</strong> trên bản đồ
          </p>
        </div>
      )}
      
      {/* Station count indicator when no user location */}
      {!isLoadingLocation && !userLocation && (
        <div className="absolute top-4 left-4 z-[1000] bg-green-50 px-4 py-2 rounded-lg shadow-md border border-green-200">
          <p className="text-sm text-green-800 font-semibold">📍 Hiển thị <strong>{validStations.length} trạm</strong> trên bản đồ</p>
          <p className="text-xs text-green-600 mt-1">
            🟢 Xanh lá: Hoạt động | 🔴 Đỏ: Không hoạt động
          </p>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewController
          stations={validStations}
          searchLocation={searchLocation}
          userLocation={userLocation}
        />

        {/* User location marker */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg mb-1">Vị trí của bạn</h3>
                  <p className="text-sm text-gray-600">
                    Các trạm được sắp xếp theo khoảng cách gần nhất
                  </p>
                </div>
              </Popup>
            </Marker>
            {/* Circle around user location */}
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={500}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 2
              }}
            />
          </>
        )}

        {/* Station markers */}
        {validStations.map((station) => (
          <Marker
            key={station._id}
            position={[station.latitude!, station.longitude!]}
            icon={station.status === 'active' ? activeIcon : inactiveIcon}
          >
            <Popup maxWidth={300}>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">{station.name}</h3>
                {station.images && station.images.length > 0 && (
                  <img
                    src={station.images[0]}
                    alt={station.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                {station.distance !== undefined && (
                  <p className="text-sm text-blue-600 mb-2">
                    <strong>📍 Khoảng cách:</strong> {station.distance.toFixed(2)} km từ vị trí của bạn
                  </p>
                )}
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Địa chỉ:</strong> {station.address}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Quận/Huyện:</strong> {station.district} - {station.city}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Điện thoại:</strong> {station.phone}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Email:</strong> {station.email}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Giờ mở cửa:</strong> {station.opening_time} - {station.closing_time}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Sức chứa:</strong> {station.current_vehicles}/{station.max_capacity}
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                    station.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {station.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default StationMap;
