from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rooms.views import create_room, join_room, get_room_snapshot, get_room_results
from questions.views import QuestionViewSet, QuestionPackViewSet

router = DefaultRouter()
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'question-packs', QuestionPackViewSet, basename='questionpack')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/rooms/', create_room, name='create_room'),
    path('api/rooms/<str:code>/join/', join_room, name='join_room'),
    path('api/rooms/<str:code>/', get_room_snapshot, name='get_room_snapshot'),
    path('api/rooms/<str:code>/results/', get_room_results, name='get_room_results'),
]
