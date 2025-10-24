import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">Metch</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ברוכים הבאים למאצי
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            הפלטפורמה המתקדמת לחיפוש עבודה וגיוס עובדים
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800">
                מחפש עבודה?
              </CardTitle>
              <CardDescription className="text-gray-600">
                מצא את העבודה המושלמת עבורך
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <ul className="text-right space-y-2 text-gray-700">
                <li>• חיפוש עבודה מתקדם עם אלגוריתמים חכמים</li>
                <li>• יצירת קורות חיים מקצועיים</li>
                <li>• התאמה אוטומטית למשרות רלוונטיות</li>
                <li>• מעקב אחר מועמדויות</li>
              </ul>
              <div className="pt-4">
                <Link to="/Register">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    התחל לחפש עבודה
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800">
                מעסיק?
              </CardTitle>
              <CardDescription className="text-gray-600">
                גייס את המועמדים הטובים ביותר
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <ul className="text-right space-y-2 text-gray-700">
                <li>• פרסום משרות בקלות ובמהירות</li>
                <li>• סינון מועמדים אוטומטי</li>
                <li>• כלי ניהול מתקדמים</li>
                <li>• אנליטיקה מפורטת</li>
              </ul>
              <div className="pt-4">
                <Link to="/Register">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    התחל לגייס עובדים
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            כבר יש לכם חשבון?
          </p>
          <Link to="/Login">
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              התחברו כאן
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
