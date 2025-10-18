import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { stationAPI } from '../api/stationAPI';
import { Station } from '../types/station';
import { MapPin, Phone, Mail, Calendar, Users, Zap, Wrench, TrendingUp } from 'lucide-react';

const StationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await stationAPI.getStationById(id);
        let s: any = null;
        if ((res as any).station) s = (res as any).station;
        else if ((res as any).stations && Array.isArray((res as any).stations) && (res as any).stations.length > 0) s = (res as any).stations[0];
        else if ((res as any)._id) s = res;
        else s = res;

        if (mounted) setStation(s as Station);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải thông tin trạm');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  

  if (loading) return <div className="p-6">Đang tải thông tin trạm...</div>;
  if (error) return <div className="p-6 text-red-600">Lỗi: {error}</div>;
  if (!station) return <div className="p-6">Không tìm thấy trạm.</div>;

  const images = station.images && station.images.length > 0 ? station.images : [];
  const mainImage = images[mainImageIndex] ?? images[0] ?? undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">{station.name}</h1>
            {station.status && (
              <span
                aria-label={`Status: ${station.status}`}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${station.status === 'active' ? 'bg-green-100 text-green-800 shadow-lg shadow-green-200' : station.status === 'inactive' ? 'bg-red-100 text-red-800 shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-800'}`}
              >
                <span className={`w-2 h-2 rounded-full ${station.status === 'active' ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`}></span>
                {station.status === 'active' ? 'Đang hoạt động' : station.status === 'inactive' ? 'Không hoạt động' : station.status}
              </span>
            )}
          </div>
          <p className="text-base text-gray-600 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            {station.address} — {station.district} — {station.city}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left: Images */}
          <div className="lg:col-span-2 flex flex-col">
            {mainImage ? (
              <div className="relative group overflow-hidden rounded-2xl">
                <img src={mainImage} alt={station.name} className="w-full h-80 md:h-96 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ) : (
              <div className="w-full h-80 md:h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Không có ảnh</p>
                </div>
              </div>
            )}

            {images.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImageIndex(i)}
                    className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-110 ${i === mainImageIndex ? 'ring-3 ring-green-500 shadow-lg' : 'opacity-60 hover:opacity-100 shadow-md'}`}
                  >
                    <img src={img} alt={`${station.name}-thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Information */}
          <div className="lg:col-span-3">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="group p-5 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-default">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <p className="text-xs text-gray-600 font-semibold">Sức chứa</p>
                </div>
                <div className="text-2xl font-bold text-gray-900">{station.current_vehicles ?? 0}/{station.max_capacity ?? '-'}</div>
              </div>
              
              <div className="group p-5 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-default">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <p className="text-xs text-gray-600 font-semibold">Có sẵn</p>
                </div>
                <div className="text-2xl font-bold text-green-600">{station.available_vehicles ?? 0}</div>
              </div>
              
              <div className="group p-5 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-default">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <p className="text-xs text-gray-600 font-semibold">Đang thuê</p>
                </div>
                <div className="text-2xl font-bold text-orange-600">{station.rented_vehicles ?? 0}</div>
              </div>
              
              <div className="group p-5 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-default">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-5 h-5 text-red-600" />
                  <p className="text-xs text-gray-600 font-semibold">Bảo trì</p>
                </div>
                <div className="text-2xl font-bold text-red-600">{station.maintenance_vehicles ?? 0}</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-6 space-y-4 mb-8 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                <Phone className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Số điện thoại</p>
                  <p className="text-gray-900 font-medium mt-1">{station.phone ?? '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Email</p>
                  <p className="text-gray-900 font-medium mt-1">{station.email ?? '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                <Calendar className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Giờ hoạt động</p>
                  <p className="text-gray-900 font-medium mt-1">{station.opening_time ?? '-'} — {station.closing_time ?? '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Địa chỉ</p>
                  <p className="text-gray-900 font-medium mt-1">{station.address ?? '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {station.description && (
          <div className="mt-12 bg-white rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-4">Mô tả</h3>
            <p className="text-gray-700 leading-relaxed text-lg">{station.description}</p>
          </div>
        )}

        {/* District Info Section */}
        <div className="mt-8 bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
          <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-6">Giới thiệu về {station.district ?? 'khu vực'}</h3>
          <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
            <p className="flex items-start gap-3">
              <span className="text-green-600 font-bold text-2xl flex-shrink-0 mt-0">•</span>
              <span>{station.district ? `${station.district} nằm ở trung tâm ${station.city ?? ''} và là một khu vực năng động, tập trung nhiều cửa hàng, quán ăn và dịch vụ. Đây là khu vực thuận tiện để di chuyển bằng xe máy hoặc xe điện, với nhiều tuyến đường chính và điểm dừng phương tiện công cộng gần đó.` : `Khu vực này có nhiều tiện ích và là vị trí thuận lợi để thuê xe.`}</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-2xl flex-shrink-0 mt-0">•</span>
              <span>Khi ghé thăm {station.district ?? 'khu vực này'}, bạn sẽ dễ dàng tìm thấy nhiều lựa chọn giải trí, ẩm thực địa phương và các điểm tham quan nổi bật. Trạm của chúng tôi nằm ở vị trí thuận lợi, giúp bạn nhanh chóng bắt đầu hành trình khám phá khu vực.</span>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default StationDetail;