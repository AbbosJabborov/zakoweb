from django.contrib import admin
from rooms.models import Room, RoomSettings
from gameplay.models import Player

def terminate_rooms(modeladmin, request, queryset):
    updated = queryset.update(status='ended')
    modeladmin.message_user(request, f"Successfully terminated {updated} room(s).")
terminate_rooms.short_description = "Terminate Selected Rooms (Set status=ended)"

class RoomSettingsInline(admin.StackedInline):
    model = RoomSettings
    can_delete = False

class PlayerInline(admin.TabularInline):
    model = Player
    extra = 0
    readonly_fields = ('session_token',)

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('code', 'status', 'current_question_index', 'created_at', 'get_player_count', 'get_is_public')
    list_filter = ('status', 'settings__is_public', 'created_at')
    search_fields = ('code', 'host_token')
    actions = [terminate_rooms]
    inlines = [RoomSettingsInline, PlayerInline]

    def get_player_count(self, obj):
        return obj.players.count()
    get_player_count.short_description = 'Players'

    def get_is_public(self, obj):
        return obj.settings.is_public if hasattr(obj, 'settings') else True
    get_is_public.short_description = 'Public'

@admin.register(RoomSettings)
class RoomSettingsAdmin(admin.ModelAdmin):
    list_display = ('room', 'question_count', 'time_per_question', 'is_public', 'answers_per_player', 'answering_cooldown')
    list_filter = ('is_public', 'answers_per_player')
