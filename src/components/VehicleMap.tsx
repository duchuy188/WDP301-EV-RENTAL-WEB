import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VehicleListItem } from '../types/vehicles';
import { useNavigate } from 'react-router-dom';
import { getVehicleTypeInVietnamese } from '../utils/vehicleUtils';

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

interface VehicleMapProps {
  vehicles: VehicleListItem[];
  searchLocation?: string;
}

// Component to handle map view control
const MapViewController: React.FC<{ 
  vehicles: VehicleListItem[];
  searchLocation?: string;
}> = ({ vehicles, searchLocation }) => {
  const map = useMap();

  useEffect(() => {
    const handleMapView = async () => {
      // Get all unique station locations from vehicles
      const stationLocations: Array<{ lat: number; lng: number }> = [];
      
      vehicles.forEach(vehicle => {
        vehicle.stations?.forEach(station => {
          if (station.latitude && station.longitude) {
            stationLocations.push({
              lat: station.latitude,
              lng: station.longitude
            });
          }
        });
      });

      // Remove duplicates
      const uniqueLocations = stationLocations.filter((location, index, self) =>
        index === self.findIndex((l) => l.lat === location.lat && l.lng === location.lng)
      );

      // If there's a search location, try to geocode it
      if (searchLocation && searchLocation.trim()) {
        try {
          const query = `${searchLocation}, Vietnam`;
          const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
          
          const response = await fetch(geocodeUrl, {
            headers: {
              'User-Agent': 'EV-Rental-Web-App'
            }
          });
          const data = await response.json();
          
          if (data && data.length > 0) {
            const { lat, lon, boundingbox } = data[0];
            
            if (boundingbox && boundingbox.length === 4) {
              const bounds = L.latLngBounds(
                [parseFloat(boundingbox[0]), parseFloat(boundingbox[2])],
                [parseFloat(boundingbox[1]), parseFloat(boundingbox[3])]
              );
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            } else {
              map.setView([parseFloat(lat), parseFloat(lon)], 13);
            }
            
            console.log('Geocoded location:', query, '→', lat, lon);
          } else if (uniqueLocations.length > 0) {
            // Fallback to fitting station markers
            const bounds = L.latLngBounds(
              uniqueLocations.map(loc => [loc.lat, loc.lng])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          // Fallback to fitting markers
          if (uniqueLocations.length > 0) {
            const bounds = L.latLngBounds(
              uniqueLocations.map(loc => [loc.lat, loc.lng])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      } else if (uniqueLocations.length > 0) {
        // No search location, just fit all markers
        const bounds = L.latLngBounds(
          uniqueLocations.map(loc => [loc.lat, loc.lng])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    const timer = setTimeout(() => {
      handleMapView();
    }, 100);

    return () => clearTimeout(timer);
  }, [vehicles, searchLocation, map]);

  return null;
};

const VehicleMap: React.FC<VehicleMapProps> = ({ vehicles, searchLocation }) => {
  const navigate = useNavigate();

  // Mock coordinates for common districts in Vietnam
  const mockCoordinates: Record<string, { latitude: number; longitude: number }> = {
    // TP.HCM
    'quan 1': { latitude: 10.7756, longitude: 106.7019 },
    'quận 1': { latitude: 10.7756, longitude: 106.7019 },
    'quan 3': { latitude: 10.7869, longitude: 106.6818 },
    'quận 3': { latitude: 10.7869, longitude: 106.6818 },
    'thu duc': { latitude: 10.8505, longitude: 106.7718 },
    'thủ đức': { latitude: 10.8505, longitude: 106.7718 },
    'binh thanh': { latitude: 10.8142, longitude: 106.7011 },
    'bình thạnh': { latitude: 10.8142, longitude: 106.7011 },
    'tan binh': { latitude: 10.8006, longitude: 106.6525 },
    'tân bình': { latitude: 10.8006, longitude: 106.6525 },
    // Hà Nội
    'hoan kiem': { latitude: 21.0285, longitude: 105.8542 },
    'hoàn kiếm': { latitude: 21.0285, longitude: 105.8542 },
    'cau giay': { latitude: 21.0333, longitude: 105.7940 },
    'cầu giấy': { latitude: 21.0333, longitude: 105.7940 },
    'dong da': { latitude: 21.0144, longitude: 105.8253 },
    'đống đa': { latitude: 21.0144, longitude: 105.8253 },
  };

  // Function to get mock coordinates based on station address/district
  const getMockCoordinates = (station: any, index: number): { latitude: number; longitude: number } => {
    // First check if station already has coordinates
    if (station.latitude && station.longitude) {
      return { latitude: station.latitude, longitude: station.longitude };
    }

    // Try to match district from address or name
    const searchText = `${station.name || ''} ${station.address || ''}`.toLowerCase();
    
    for (const [district, coords] of Object.entries(mockCoordinates)) {
      if (searchText.includes(district)) {
        // Add small random offset to avoid exact overlapping
        return {
          latitude: coords.latitude + (Math.random() - 0.5) * 0.01,
          longitude: coords.longitude + (Math.random() - 0.5) * 0.01
        };
      }
    }

    // Default: TP.HCM center with offset based on index
    const baseLatitude = 10.8231;
    const baseLongitude = 106.6297;
    const offset = index * 0.02;
    
    return {
      latitude: baseLatitude + (offset % 0.1),
      longitude: baseLongitude + (Math.floor(offset / 0.1) * 0.02)
    };
  };

  // Get all stations with valid coordinates from vehicles
  const stationsWithVehicles = React.useMemo(() => {
    const stationMap = new Map<string, {
      station: any;
      vehicles: VehicleListItem[];
      coordinates: { latitude: number; longitude: number };
    }>();

    vehicles.forEach(vehicle => {
      vehicle.stations?.forEach((station, index) => {
        const coords = getMockCoordinates(station, index);
        const key = `${coords.latitude.toFixed(4)}-${coords.longitude.toFixed(4)}`;
        
        if (!stationMap.has(key)) {
          stationMap.set(key, {
            station: { ...station, ...coords },
            vehicles: [],
            coordinates: coords
          });
        }
        stationMap.get(key)!.vehicles.push(vehicle);
      });
    });

    return Array.from(stationMap.values());
  }, [vehicles]);

  // Default center (Ho Chi Minh City)
  const defaultCenter: [number, number] = [10.8231, 106.6297];

  console.log('VehicleMap - Total vehicles:', vehicles.length);
  console.log('VehicleMap - Stations with coordinates:', stationsWithVehicles.length);
  console.log('VehicleMap - Search location:', searchLocation);

  if (vehicles.length === 0) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500 text-lg mb-2">Không có xe nào để hiển thị trên bản đồ</p>
        <p className="text-gray-400 text-sm">Vui lòng thử lại hoặc điều chỉnh bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
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
        <MapViewController vehicles={vehicles} searchLocation={searchLocation} />
        
        {stationsWithVehicles.map(({ station, vehicles: stationVehicles, coordinates }, index) => (
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

