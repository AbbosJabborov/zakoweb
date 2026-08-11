from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse
from django.conf import settings
from django.views.static import serve
from rest_framework.routers import DefaultRouter
from rooms.views import create_room, join_room, get_room_snapshot, get_room_results, list_public_rooms, terminate_room_api
from questions.views import QuestionViewSet, QuestionPackViewSet

def health_check(request):
    return JsonResponse({
        "status": "online",
        "service": "Zakoweb API & WebSocket Channels Server",
        "version": "1.0.0"
    })

router = DefaultRouter()
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'question-packs', QuestionPackViewSet, basename='questionpack')

urlpatterns = [
    path('', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/rooms/', create_room, name='create_room'),
    path('api/public-rooms/', list_public_rooms, name='list_public_rooms'),
    path('api/rooms/<str:code>/join/', join_room, name='join_room'),
    path('api/rooms/<str:code>/terminate/', terminate_room_api, name='terminate_room_api'),
    path('api/rooms/<str:code>/', get_room_snapshot, name='get_room_snapshot'),
    path('api/rooms/<str:code>/results/', get_room_results, name='get_room_results'),
]

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
