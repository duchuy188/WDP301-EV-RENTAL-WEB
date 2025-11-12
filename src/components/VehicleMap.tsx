import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VehicleListItem } from '../types/vehicles';
import { useNavigate } from 'react-router-dom';
import { getVehicleTypeInVietnamese } from '../utils/vehicleUtils';
import { geocodeAddress } from '../utils/geocodingService';
import { getStationCoordinates } from '../utils/districtCoordinates';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for vehicle locations (green for available)
const vehicleIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
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

interface VehicleMapProps {
  vehicles: VehicleListItem[];
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

// Component to handle map view control and user location
const MapViewController: React.FC<{
  vehicles: VehicleListItem[];
  searchLocation?: string;
  userLocation: UserLocation | null;
  stationsWithCoords: Array<{ latitude: number; longitude: number }>;
}> = ({ vehicles, searchLocation, userLocation, stationsWithCoords }) => {
  const map = useMap();

  useEffect(() => {
    const handleMapView = async () => {
      const locationsToFit: Array<[number, number]> = [];

      // Add user location if available
      if (userLocation) {
        locationsToFit.push([userLocation.latitude, userLocation.longitude]);
      }

      // Add station locations
      stationsWithCoords.forEach(coord => {
        locationsToFit.push([coord.latitude, coord.longitude]);
      });

      // If there's a search location, try to geocode it
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
  }, [vehicles, searchLocation, map, userLocation, stationsWithCoords]);

  return null;
};

const VehicleMap: React.FC<VehicleMapProps> = ({ vehicles, searchLocation }) => {
  const navigate = useNavigate();
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

  // Get all stations with valid coordinates from vehicles
  const stationsWithVehicles = React.useMemo(() => {
    const stationMap = new Map<string, {
      station: any;
      vehicles: VehicleListItem[];
      coordinates: { latitude: number; longitude: number };
      distance?: number;
    }>();

    let stationIndex = 0;
    
    vehicles.forEach((vehicle) => {
      if (!vehicle.stations || vehicle.stations.length === 0) {
        console.warn(`Vehicle ${vehicle.brand} ${vehicle.model} has no stations`);
        return;
      }

      vehicle.stations.forEach((station) => {
        // Get coordinates for this station
        const coords = getStationCoordinates(station, stationIndex);
        stationIndex++;

        // Use station ID, or create unique key from name+address
        // This prevents stations from being merged incorrectly
        const key = station._id || 
                   `${station.name || 'unknown'}-${station.address || 'unknown'}`.toLowerCase();

        if (!stationMap.has(key)) {
          // Calculate distance from user location if available
          let distance: number | undefined;
          if (userLocation) {
            distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              coords.latitude,
              coords.longitude
            );
          }

          stationMap.set(key, {
            station: { ...station, ...coords },
            vehicles: [],
            coordinates: coords,
            distance
          });
        }
        
        // Add this vehicle to the station's vehicle list
        const stationData = stationMap.get(key)!;
        // Avoid duplicates
        if (!stationData.vehicles.find(v => v.sample_vehicle_id === vehicle.sample_vehicle_id)) {
          stationData.vehicles.push(vehicle);
        }
      });
    });

    // Convert to array and sort by distance if user location is available
    let stationsArray = Array.from(stationMap.values());
    
    if (userLocation) {
      stationsArray = stationsArray.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    return stationsArray;
  }, [vehicles, userLocation]);

  // Default center (Ho Chi Minh City)
  const defaultCenter: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [10.8231, 106.6297];

  if (vehicles.length === 0) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500 text-lg mb-2">Không có xe nào để hiển thị trên bản đồ</p>
        <p className="text-gray-400 text-sm">Vui lòng thử lại hoặc điều chỉnh bộ lọc</p>
      </div>
    );
  }

  if (stationsWithVehicles.length === 0) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500 text-lg mb-2">Không có trạm nào để hiển thị</p>
        <p className="text-gray-400 text-sm">Các xe chưa có thông tin trạm</p>
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
            📍 Hiển thị <strong>{stationsWithVehicles.length} trạm</strong> thuê xe
          </p>
        </div>
      )}
      
      {/* Station count indicator when no user location */}
      {!isLoadingLocation && !userLocation && (
        <div className="absolute top-4 left-4 z-[1000] bg-green-50 px-4 py-2 rounded-lg shadow-md border border-green-200">
          <p className="text-sm text-green-800 font-semibold">📍 Hiển thị <strong>{stationsWithVehicles.length} trạm</strong> thuê xe</p>
          <p className="text-xs text-green-600 mt-1">
            🟢 Marker xanh = Có xe sẵn
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
          vehicles={vehicles}
          searchLocation={searchLocation}
          userLocation={userLocation}
          stationsWithCoords={stationsWithVehicles.map(s => s.coordinates)}
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
                    Các trạm gần nhất được hiển thị bằng marker màu xanh lá
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
        {stationsWithVehicles.map(({ station, vehicles: stationVehicles, coordinates, distance }, index) => (
          <Marker
            key={`${coordinates.latitude}-${coordinates.longitude}-${index}`}
            position={[coordinates.latitude, coordinates.longitude]}
            icon={vehicleIcon}
          >
            <Popup maxWidth={350}>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">{station.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Địa chỉ:</strong> {station.address}
                </p>
                {distance !== undefined && (
                  <p className="text-sm text-blue-600 mb-2">
                    <strong>📍 Khoảng cách:</strong> {distance.toFixed(2)} km từ vị trí của bạn
                  </p>
                )}
                <p className="text-sm text-gray-600 mb-3">
                  <strong>Số xe có sẵn:</strong> {stationVehicles.length} xe
                </p>

                {/* List of available vehicles at this station */}
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Xe có sẵn tại trạm:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {stationVehicles.slice(0, 5).map((vehicle, vIndex) => (
                      <div
                        key={`${vehicle.sample_vehicle_id}-${vIndex}`}
                        className="flex items-start gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => navigate(`/vehicle/${encodeURIComponent(vehicle.sample_vehicle_id)}`, {
                          state: { selectedVehicle: vehicle }
                        })}
                      >
                        {vehicle.sample_image && (
                          <img
                            src={vehicle.sample_image}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="text-xs text-gray-600">
                            {vehicle.price_per_day?.toLocaleString('vi-VN')} đ/ngày
                          </p>
                          <p className="text-xs text-green-600">
                            {getVehicleTypeInVietnamese(vehicle.type)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {stationVehicles.length > 5 && (
                      <p className="text-xs text-gray-500 italic text-center pt-1">
                        +{stationVehicles.length - 5} xe khác...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default VehicleMap;
