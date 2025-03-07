class channel_state_manager {

    constructor() {
        this.activeChannels = new Map(); // key: user_id, value: Set<channel_id>
    }
    setActive(user_id, channel_id) {
        if (!this.activeChannels.has(user_id)) {
            this.activeChannels.set(user_id, new Set());
        }
        this.activeChannels.get(user_id).add(channel_id);
    }

    setInactive(user_id, channel_id) {
        if (this.activeChannels.has(user_id)) {
            this.activeChannels.get(user_id).delete(channel_id);
        }
    }

    isActive(user_id, channel_id) {
        return this.activeChannels.get(user_id)?.has(channel_id) || false;
    }
}

module.exports = new channel_state_manager();