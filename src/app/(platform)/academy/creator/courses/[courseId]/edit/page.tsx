
import { creatorGetCourse } from '@/app/data/creator/creator-get-course'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EditCourseForm from './_components/edit-course-form'
import CourseStructure from './_components/course-structure'

type Params = Promise<{ courseId: string }>
export default async function EditCourseRoute({ params }: { params: Params }) {
    const { courseId } = await params
    const data = await creatorGetCourse(courseId)

    return (
        <div>
            <div className="mb-8 pb-5 border-b border-gray-500">
                <h1 className="text-3xl font-bold">
                    ✏️ Edit Course:{' '}
                    <span className="text-primary bg-primary/5 px-2 py-1 rounded-md">
                        {data.title}
                    </span>
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    Modify course details, content, and settings below.
                </p>
            </div>
            <Tabs defaultValue='basic-info' className='w-full'>
                <TabsList className='grid grid-cols-2 w-full'>
                    <TabsTrigger value='basic-info'> Basic Info</TabsTrigger>
                    <TabsTrigger value='course-structure'> Course Structure</TabsTrigger>
                </TabsList>
                <TabsContent value='basic-info'>
                    <EditCourseForm data={data} />
                </TabsContent>
                <TabsContent value='course-structure'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Structure</CardTitle>
                            <CardDescription>
                                Update Your course structure
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CourseStructure data={data} />

                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    )
}
