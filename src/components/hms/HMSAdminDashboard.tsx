import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HostelManagement from './HostelManagement';
import RoomManagement from './RoomManagement';
import StudentManagement from './StudentManagement';
import WardenManagement from './WardenManagement';
import CourseManagement from './CourseManagement';

const HMSAdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Hostel Management System</h1>
        <p className="text-gray-600">Admin Dashboard</p>
      </div>

      <Tabs defaultValue="hostels" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hostels">Hostels</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="wardens">Wardens</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="hostels">
          <HostelManagement />
        </TabsContent>

        <TabsContent value="rooms">
          <RoomManagement />
        </TabsContent>

        <TabsContent value="students">
          <StudentManagement />
        </TabsContent>

        <TabsContent value="wardens">
          <WardenManagement />
        </TabsContent>

        <TabsContent value="courses">
          <CourseManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSAdminDashboard;