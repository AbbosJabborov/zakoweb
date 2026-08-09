from django.urls import re_path
from gameplay.consumers import RoomConsumer

websocket_urlpatterns = [
    re_path(r'ws/room/(?P<room_code>\w+)/?$', RoomConsumer.as_asgi()),
]
