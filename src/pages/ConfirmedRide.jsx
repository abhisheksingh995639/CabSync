import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ConfirmedRide = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <main className="max-w-4xl mx-auto p-md md:p-xl space-y-md animate-fade-in">
      {/* Status Banner */}
      <div className="bg-primary-container text-text-primary p-md rounded-xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div>
            <h3 className="font-h3 text-h3">Ride Confirmed</h3>
            <p className="font-body-md text-body-md opacity-90">Driver is arriving in 8 mins</p>
          </div>
        </div>
        <div className="bg-white/30 px-md py-sm rounded-full font-label-caps text-label-caps">
          RIDE ID: #CS-9921
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-md">
          <div className="bg-white border border-border-subtle rounded-xl shadow-md overflow-hidden h-[300px] md:h-[450px] relative">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsKhBq8ccgeiFr_0AssX1sTcEJCW5oAZxwbJoEP7uB_WZlWj89nSXRZ-9qnReTsEWK9B8d7CKu8jz7t5pfhlLcg1Ai-uOWxENQqUyM1IGBKzPhj11J2tk7z6hU4mRyUlNkIzQTr2yWsZS4YZft047yZq4xdmxANYN6HuFA6CdC5UU25pfe_MoFOnLQaV8Ia4bnXLgvh3hDH1-UL5omirSnfo1cPXL07OtEFTXFgWaGn06aIudd0mvLIDdrSDa1IBTVb0l7dlhK2a1F" 
              alt="Route Map" 
            />
            <div className="absolute bottom-md left-md right-md bg-white p-md rounded-xl shadow-lg border border-border-subtle flex flex-col gap-sm">
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-primary">trip_origin</span>
                <p className="font-body-md text-body-md text-secondary">221B Baker Street, San Francisco</p>
              </div>
              <div className="h-4 w-px bg-border-subtle ml-[11px]"></div>
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <p className="font-body-md text-body-md font-bold">SFO International Airport, Terminal 2</p>
              </div>
            </div>
          </div>
          {/* Driver Card */}
          <div className="bg-white border border-border-subtle rounded-xl shadow-md p-md flex items-center justify-between">
            <div className="flex items-center gap-md">
              <img 
                alt="Driver" 
                className="w-16 h-16 rounded-full border-2 border-primary-container" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU5JqCd--JBU4ZGmaJJoVL9AzV2w95Arx5Ei5r9_r1oyEvAZ1fiasXi7sbPf4ydxZxG7N6OeIRIhG2o0j3Hf5ufUcLQJ6Eu6lK-glsyAIjCFGSPxpPTpwNOa0VlvTo0WiFi72l0tasKOahi5GsTtL9YO8YWNhyEU6lLqh8J4LJYb6nEjLT5hUU4axJQWl8AcCpbtQt2JZAEcnwML_nstXs_DbdRfXwCK8xwwSensToz1JJBFpPkxnlu_0mELIhfUf61JNRNDvrDeqk" 
              />
              <div>
                <h3 className="font-h3 text-h3">Marcus Rivera</h3>
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-body-md text-body-md font-bold">4.9</span>
                  <span className="text-secondary text-sm">• Toyota Prius (K9X-224)</span>
                </div>
              </div>
            </div>
            <button className="bg-primary-container hover:bg-accent-light text-text-primary px-lg py-md rounded-full font-label-caps flex items-center gap-sm active:scale-95 transition-all shadow-md">
              <span className="material-symbols-outlined">chat</span>
              Message Driver
            </button>
          </div>
        </div>

        {/* Details Sidebar */}
        <div className="space-y-md">
          {/* Fare Split Card */}
          <div className="bg-white border border-border-subtle rounded-xl shadow-md p-md space-y-md">
            <h4 className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">Payment Breakdown</h4>
            <div className="space-y-sm">
              <div className="flex justify-between items-center">
                <span className="text-secondary">Total Fare</span>
                <span className="font-h3 text-h3">$48.50</span>
              </div>
              <div className="h-px bg-border-subtle w-full"></div>
              <div className="bg-primary-container/10 p-md rounded-lg border border-primary-container/30">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary">Your Split</span>
                  <span className="font-h2 text-h2 text-primary">$12.12</span>
                </div>
                <p className="text-sm text-secondary mt-xs italic">(Shared equally by 4 people)</p>
              </div>
            </div>
          </div>
          {/* Passengers Card */}
          <div className="bg-white border border-border-subtle rounded-xl shadow-md p-md space-y-md">
            <div className="flex justify-between items-center">
              <h4 className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">Co-Passengers</h4>
              <span className="bg-surface-container-high px-sm py-xs rounded text-sm font-bold">4 Total</span>
            </div>
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <div className="relative">
                    <img className="w-10 h-10 rounded-full border" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCbSjQjEYWNU5Oq-dcaUVwAfWxye2Y656Vay1ozYF9bEUgze1LqW3HyOUbx8AQaTMLBAwDBw1k4GFHwGLpfBl6ThAiC_UxVe1ffyrCcqxiKcnXy4dUIMCCf-nbUiF-JjXNKLkqFZhCHqAL5DYRRk6gMK8mafcOdl_PYOZBmcAO9YH56pH4kBJqsJNQSOVlL_C0Sa_3qJpDr5cg4352Cad3GigVH-oVRGdC7nzTtx6XuFOGPaSXFCWSBrR-PMd0rkHaqBl9yMDNhbpF" alt="Passenger" />
                    <div className="absolute -top-1 -right-1 bg-primary-container text-[8px] px-1 rounded-full border border-white">YOU</div>
                  </div>
                  <span className="font-body-md font-bold">Alex Johnson</span>
                </div>
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              {/* Other passengers placeholders... */}
            </div>
          </div>
          {/* Trip Actions */}
          <div className="bg-surface-container-high p-md rounded-xl space-y-sm border border-border-subtle">
            <button className="w-full py-md bg-white border border-border-subtle rounded-full text-error font-bold active:scale-95 transition-all">Cancel Ride</button>
            <button className="w-full py-md bg-white border border-border-subtle rounded-full text-text-primary font-bold active:scale-95 transition-all">Report Issue</button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ConfirmedRide;
