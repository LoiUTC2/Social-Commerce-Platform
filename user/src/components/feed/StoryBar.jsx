import React from 'react';
import { Plus } from 'lucide-react';
import avatar from '../../assets/GIABAOAVT.jpg'
import avatar1 from '../../assets/ramos.webp'
import avatar2 from '../../assets/rice.webp'
import avatar3 from '../../assets/kaka.webp'
import avatar4 from '../../assets/áensio.jpg'


const StoryBar = () => {
  const stories = [
    { id: 1, name: 'Noncakeith', image: avatar4, avatar: avatar},
    { id: 2, name: 'Thùy Linh', image: avatar1, avatar: avatar },
    { id: 3, name: 'Quốc Khánh', image: avatar2, avatar: avatar },
    { id: 4, name: 'Nga Nga', image: avatar3, avatar: avatar },
    { id: 5, name: 'Quốc Khánh', image: avatar1, avatar: avatar },
    { id: 6, name: 'Nga Nga', image: avatar4, avatar: avatar },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-2">Tin</h3>
      <div className="flex gap-3 overflow-x-auto">
        {/* Tạo tin */}
        <div className="w-24 h-40 bg-gray-200 rounded-xl flex flex-col items-center justify-center text-sm text-gray-700 hover:shadow cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-1">
            <Plus size={20} className="text-blue-500" />
          </div>
          Tạo tin
        </div>

        {/* Story list */}
        {stories.map((story) => (
          <div key={story.id} className="w-24 h-40 rounded-xl bg-cover bg-center relative overflow-hidden" style={{ backgroundImage: `url(${story.image})` }}>
            <div className="absolute top-2 left-2 w-9 h-9 rounded-full border-2 border-white">
              <img src={story.avatar} alt={story.name} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium truncate">
              {story.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryBar;
