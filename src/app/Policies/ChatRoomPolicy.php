<?php

namespace App\Policies;

use App\Models\ChatRoom;
use App\Models\User;

class ChatRoomPolicy
{
    public function view(User $user, ChatRoom $room): bool
    {
        return $room->user_id === $user->id
            || ($room->restaurant && $room->restaurant->user_id === $user->id);
    }
}
