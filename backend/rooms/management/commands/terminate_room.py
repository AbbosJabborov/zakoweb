from django.core.management.base import BaseCommand
from rooms.models import Room

class Command(BaseCommand):
    help = 'Terminate a room by room code or terminate all active rooms'

    def add_arguments(self, parser):
        parser.add_argument('code', nargs='?', type=str, help='Room code to terminate')
        parser.add_argument('--all', action='store_true', help='Terminate all active/lobby rooms')

    def handle(self, *args, **options):
        if options['all']:
            rooms = Room.objects.filter(status__in=['lobby', 'active'])
            count = rooms.count()
            rooms.update(status='ended')
            self.stdout.write(self.style.SUCCESS(f"Successfully terminated all {count} active/lobby room(s)."))
            return

        code = options.get('code')
        if not code:
            self.stdout.write(self.style.ERROR("Please specify a room code (e.g. python manage.py terminate_room EAEX2Q) or pass --all"))
            return

        try:
            room = Room.objects.get(code__iexact=code.strip())
            room.status = 'ended'
            room.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully terminated Room '{room.code}'."))
        except Room.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Room with code '{code}' not found."))
